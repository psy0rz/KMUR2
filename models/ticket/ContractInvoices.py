from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.Contracts
import models.ticket.Invoices
import models.ticket.Relations
import datetime
import time
import bottle

import bson.objectid

class ContractInvoices(models.core.Protected.Protected):
    '''Keeps a record of all hours that where already bought and invoiced.

    '''

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'date': fields.Timestamp(desc='Date', required=True),
                'desc': fields.String(desc='Description'),
                'allowed_groups': models.mongodb.Relation(
                    desc='Groups with access',
                    model=models.core.Groups.Groups,
                    resolve=False,
                    check_exists=False,
                    list=True),
                'allowed_users': models.mongodb.Relation(
                    desc='Users with access',
                    model=models.core.Users.Users,
                    resolve=False,
                    check_exists=False,
                    list=True),
                'relation': models.mongodb.Relation(
                    desc='Relation',
                    model=models.ticket.Relations.Relations,
                    min=1,
                    resolve=False,
                    check_exists=True,
                    list=False),
                'contract': models.mongodb.Relation(
                    desc='Contract',
                    model=models.ticket.Contracts.Contracts,
                    min=1,
                    resolve=False,
                    check_exists=True,
                    list=False),
                'contract_title': fields.String(desc='Contract'),
                'invoice': models.mongodb.Relation(
                    desc='Invoice',
                    model=models.ticket.Invoices.Invoices,
                    resolve=False,
                    check_exists=True,
                    list=False),
                'minutes_bought': fields.Number(desc='Bought minutes'),
                'minutes_used': fields.Number(desc='Used minutes'), #calculated automaticly according to linked TicketObjects
                #balance should usually be 0 in post-payed contracts, and can be negative in pre-payed.
                'minutes_balance': fields.Number(desc='New budget'),  #calculated automaticly
                'import_id': fields.String(desc='Import ID'),
            }),
            list_key='_id'
        )

    write={
        'allowed_groups': {
            'context_field': 'group_ids',
            'check': True
        },
        'allowed_users': {
            'context_field': 'user_id',
            'check': True
        },
    }

    read=write

    #call order: recalc_minutes_used -> put -> recalc_minutes_balance


    @RPC(roles="user")
    def recalc_minutes_balance(self, relation_id, contract_id):
        """recalculate budget of all contract invoices of specified relation,contract combo"""

        contracts_model=models.ticket.Contracts.Contracts(self.context)
        contract=contracts_model._unprotected_get(_id=contract_id)

        contract_invoices=self._unprotected_get_all(
                match={
                "relation": relation_id,
                "contract": contract_id,
                },
                fields=[ "minutes_used", "minutes_bought", "minutes_balance", "desc" ],
                sort=[ ( 'date', 1 )]
            )

        minutes_balance=0
        for contract_invoice in contract_invoices:
            minutes_balance+=contract_invoice['minutes_bought']-contract_invoice['minutes_used']

            #make sure the budget doesnt get too high
            if "max_budget" in contract and contract["max_budget"] and minutes_balance>contract['max_budget']:
                minutes_balance=contract["max_budget"]

            if ('minutes_balance' not in contract_invoice) or (contract_invoice["minutes_balance"]!=minutes_balance):
                contract_invoice['minutes_balance']=minutes_balance
                self._unprotected_put(
                    contract_invoice
                    )

                #since anyone can call this function, be carefull not to reveal too much information
                self.event("changed",{
                    "_id": contract_invoice["_id"],
                    "minutes_balance": contract_invoice["minutes_balance"],
                    "minutes_used": contract_invoice["minutes_used"],
                    "minutes_bought": contract_invoice["minutes_bought"]
                    })




    def round_minutes(self, ticket_object, contract):
        """perform correct 'rounding' of minutes and factor correction"""
        minutes=ticket_object["minutes"]

        #make sure it has the minimum minutes
        if  minutes>0 and minutes<contract['minutes_minimum']:
            minutes=contract['minutes_minimum']

        #apply factor
        minutes=minutes*ticket_object['minutes_factor']

        #round up to whole minute-blocks
        #e.g when minutes_rounding=15:
        #14 becomes 15 minutes. but 16 becomes 30 minutes.
        minutes=((minutes+contract['minutes_rounding']-1)//contract['minutes_rounding'])*contract['minutes_rounding']

        return(minutes)


    @RPC(roles="user")
    def recalc_minutes_used(self, _id):
        """recalculate minutes for one contract_invoice, by adding the minutes of all ticket objects that point to contract_invoice with this _id

        rounds minutes according to round_minutes

        usually called by TicketObjects on change
        """

        if not _id:
            return

        doc=self._unprotected_get(_id)

        contracts_model=models.ticket.Contracts.Contracts(self.context)
        contract=contracts_model._unprotected_get(_id=doc["contract"])

        #get used minutes and calculate total
        minutes_used=0
        ticket_objects_model=models.ticket.TicketObjects.TicketObjects(self.context)
        ticket_objects=ticket_objects_model._unprotected_get_all(
                match={
                    "billing_contract_invoice": _id
                }
            )

        for ticket_object in ticket_objects:
            minutes_used=minutes_used+self.round_minutes(ticket_object, contract)

        #no change?
        if minutes_used==doc["minutes_used"]:
            return

        doc["minutes_balance"]=doc["minutes_balance"]+doc["minutes_used"]-minutes_used #this is recalculated anyway, but this prevents an extra update/log entry
        doc["minutes_used"]=minutes_used
        self._unprotected_put(doc)

        #since anyone can call this function, be carefull not to reveal too much information
        self.event("changed",{
            "_id": doc["_id"],
            "minutes_balance": doc["minutes_balance"],
            "minutes_used": doc["minutes_used"],
            "minutes_bought": doc["minutes_bought"]
            })

        self.recalc_minutes_balance(doc['relation'], doc['contract'])


    @RPC(roles="finance_admin")
    def auto_invoice_all(self):
        """check all relations and contracts, and auto_invoice those that are missing.

        this should be called by a cronjob.

        it does a simple stringcompare on the description field of the contractinvoice, to determine if its time to autoinvoice it.
        """

        #all relations with contracts
        relations=call_rpc(self.context, 'ticket', 'Relations', 'get_all',
            fields=[ "contracts", "invoice" ],
            spec_and=[ {
                "contracts": {
                    "$not": {
                        "$size": 0
                        }
                    }
                } ]
             )

        for relation in relations:

            #traverse all contracts for this relation
            for contract_id in relation["contracts"]:
               #get contract
                try:
                    contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_id)
                except:
                    #skip contracts we cant read
                    continue

                if not "auto" in contract or contract["auto"]!="monthly":
                    continue

                if contract["type"] not in [ "post", "prepay" ]:
                    continue

                desc=datetime.datetime.now().strftime("%B %Y")

                #check if its already generated for this desc,relation,contract combo
                latest_contract_invoices=self.get_all(
                        match={
                            "relation": relation["_id"],
                            "contract": contract_id,
                            "desc": desc
                        },
                        limit=1,
                        sort=[ ( 'date', -1 )]
                    )


                if len(latest_contract_invoices)==0:
                    self.auto_invoice(relation["_id"], contract_id, desc)


    @RPC(roles="finance_admin")
    def auto_invoice(self, relation_id, contract_id, desc=None):
        """automaticly collects un-invoiced ticket_objects, creates contract_invoice and an actual invoice"""

        contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_id)
        relation=call_rpc(self.context, 'ticket', 'Relations', 'get', _id=relation_id)

        if contract["type"] not in [ "post", "prepay" ]:
            raise fields.FieldError("This contract cant be auto invoiced")

        if not desc:
            desc=datetime.datetime.now().strftime("%B %Y")

        contract_invoice={
            'date': datetime.datetime.now().timestamp(),
            'desc': desc,
            'allowed_users': relation['allowed_users'],
            'allowed_groups': relation['allowed_groups'],
            'relation': relation['_id'],
            'contract': contract['_id'],
            'minutes_used': 0,
            'minutes_bought':0,
        }

        #list of items to add to the actual invoice
        invoice_items=[]

        #prepayed contract
        if contract['type']=='prepay':
            #buy fixed number of minutes for fixed price:
            contract_invoice['minutes_bought']=contract['minutes']
            invoice_items.append({
                'amount': 1,
                'desc':contract['title']+": "+desc,
                'price': contract['price'],
                'tax': contract['tax']
            })

        #get uninvoiced ticket_objects for this relation,contract combo
        ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
            fields=["title", "minutes", "minutes_factor", "start_time" ],
            match={
                "billing_relation": relation["_id"],
                "billing_contract": contract_id,
                "billing_contract_invoice": None,
            },
            sort=[ ( "start_time", 1 )])

        #now create contract invoice, so we have the _id
        contract_invoice=self.put(**contract_invoice)


        #determine price per hour:
        if contract['type']=='post':
            #post: pay per hour
            price_per_hour=round(contract['price']*60/contract['minutes'], 2)
        elif contract['type']=='prepay':
            #prepayed: fixed price per month, not per hour
            price_per_hour=0

        total_hours=0

        #traverse all the un-invoiced ticket_objects
        for ticket_object in ticket_objects:
            minutes=self.round_minutes(ticket_object, contract)
            hours=round(minutes/60,2)
            total_hours+=hours

            #append details to invoice
            if contract['invoice_details']=="time":
                #invoice description for this time
                invoice_desc="["+contract['title']+"] "+time.strftime(models.ticket.Invoices.hours_format, time.localtime(ticket_object['start_time']))+" "+ticket_object['title']
                if ticket_object['minutes_factor']!=1:
                    invoice_desc=invoice_desc+" \n(calculated at {}% rate)".format(ticket_object['minutes_factor']*100)

                invoice_items.append({
                    'amount': hours,
                    'desc':invoice_desc,
                    'price': price_per_hour,
                    'tax': contract['tax']
                })


            #update minutes used and bought
            contract_invoice['minutes_used']+=minutes
            if contract['type']=='post':
                contract_invoice['minutes_bought']+=minutes

            #point the ticket_object to the current contract_invoice
            ticket_object['billing_contract_invoice']=contract_invoice['_id']
            call_rpc(self.context, 'ticket', 'TicketObjects', 'put', update_contract_invoice=False, **ticket_object)


        #if its a post-payed contract without details, just add a total of all the used hours
        if contract['invoice_details']=="none" and contract['type']=="post":
            invoice_items.append({
                'amount': total_hours,
                'desc':contract['title']+": "+desc,
                'price': price_per_hour,
                'tax': contract['tax']
            })


        #only create an actual invoice if we have items
        if invoice_items:
            #create actual invoice
            invoice=call_rpc(self.context, 'ticket', 'Invoices', 'add_items',
                 to_relation=relation['_id'],
                 currency=contract['currency'],
                 items=invoice_items,
            )

            #finally update contract_invoice
            contract_invoice['invoice']=invoice['_id']
            contract_invoice=self.put(**contract_invoice)


            #now add some usefull notes to the invoice
            contract_invoice=self.get(contract_invoice["_id"]) #reget it to get updated values for minutes_used and balance
            try:
                notes=contract['invoice_notes_format'].format(**contract_invoice)
            except:
                notes=contract['invoice_notes_format']

            invoice={
                "_id": invoice["_id"],
                "notes": invoice["notes"]+notes,
                'allowed_users': relation['allowed_users'],
                'allowed_groups': relation['allowed_groups'],
            }
            invoice=call_rpc(self.context, 'ticket', 'Invoices', 'put', **invoice)


        return(contract_invoice)


    @RPC(roles="finance_admin")
    def manual_invoice(self, contract_invoice_id):
        """Add details of specified contract_invoice to invoice (for a price per hour)

        this is usefull for manual invoicing
        """

        contract_invoice=call_rpc(self.context, 'ticket', 'ContractInvoices', 'get', _id=contract_invoice_id)

        if not contract_invoice["invoice"]:
            raise fields.FieldError("This contract order doesnt have a invoice yet.")

        contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_invoice["contract"])
        invoice=call_rpc(self.context, 'ticket', 'Invoices', 'get', _id=contract_invoice["invoice"])

        price_per_hour=round(contract['price']*60/contract['minutes'], 2)

        ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
            match={
                "billing_contract_invoice": contract_invoice_id,
            }
        )


        for ticket_object in ticket_objects:
            minutes=self.round_minutes(ticket_object, contract)
            hours=round(minutes/60,2)

            #invoice description for this time
            invoice_desc=ticket_object['title']
            if ticket_object['minutes_factor']!=1:
                invoice_desc=invoice_desc+" \n(calculated at {}% rate)".format(ticket_object['minutes_factor']*100)

            invoice["items"].append({
                'amount': hours,
                'desc':invoice_desc,
                'price': price_per_hour,
                'tax': contract['tax']
            })

        call_rpc(self.context, 'ticket', 'Invoices', 'put',
            _id=invoice["_id"],
            items=invoice["items"]
        )


    @RPC(roles="user")
    def get_used_contracts(self, relation_id):
        '''get unique list of used contract_ids for specified relation'''

        return(
            self.db[self.default_collection].
                find({ "relation" : bson.objectid.ObjectId(relation_id) }).
                distinct("contract")
        )


    @RPC(roles="user")
    def get_budgets(self, relation_id, limit=None, skip=None, sort=None):
        """calculate all the budgets of a relation, this includes uninvoiced_ticketobjects"""

        relation=call_rpc(self.context, 'ticket', 'Relations', 'get', _id=relation_id)

        #first determine all contracts that are used anywhere
        used_contract_ids=set()
        used_contract_ids.update(relation["contracts"])
        used_contract_ids.update(call_rpc(self.context, 'ticket', 'TicketObjects', 'get_used_contracts', relation_id=relation_id))
        used_contract_ids.update(self.get_used_contracts(relation_id=relation_id))

        budgets=[]

        #traverse all contracts:
        #contracts=call_rpc(self.context, 'ticket', 'Contracts', 'get_all') #slower but shows deactivated contracts as well.
        contracts=call_rpc(self.context, 'ticket', 'Contracts', 'get_all', match_in={ "_id": used_contract_ids })


        for contract in contracts:


            #get budget from latest contract_invoice
            latest_contract_invoices=self._unprotected_get_all(
                    match={
                        "relation": relation["_id"],
                        "contract": contract["_id"],
                    },
                    limit=1,
                    sort=[ ( 'date', -1 )]
                )


            if latest_contract_invoices:
                minutes_balance=latest_contract_invoices[0]["minutes_balance"]
            else:
                minutes_balance=0


            #get uninvoiced hours for this relation,contract combo
            ticket_objects_model=models.ticket.TicketObjects.TicketObjects(self.context)
            ticket_objects=ticket_objects_model._unprotected_get_all(
                fields=["title", "minutes", "minutes_factor" ],
                match={
                    "billing_relation": relation["_id"],
                    "billing_contract": contract["_id"],
                    "billing_contract_invoice": None,
                })

            for ticket_object in ticket_objects:
                minutes_balance-=self.round_minutes(ticket_object, contract)

            budgets.append({
                "_id": contract["_id"],
                "contract_title": contract["title"],
                "minutes_balance": minutes_balance
            })

        return(budgets)


    @RPC(roles="finance_admin")
    def put(self, recalc_minutes_balance=True, **doc):

        if '_id' in doc:
            log_txt="Changed contract invoice {desc}".format(**doc)
            old_doc=self._get(doc["_id"])
        else:
            log_txt="Created new contract invoice {desc}".format(**doc)
            doc["minutes_used"]=0

        if 'contract' in doc:
            contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=doc['contract'])
            doc['contract_title']=contract['title']

        ret=self._put(doc)

        if recalc_minutes_balance:
            if 'relation' in doc and 'contract' in doc:
                self.recalc_minutes_balance(doc['relation'], doc['contract'])

            #recalc previous selected contract
            if '_id' in doc and 'relation' in old_doc and 'contract' in old_doc:
                self.recalc_minutes_balance(old_doc['relation'], old_doc['contract'])


        self.event("changed",ret)
        self.info(log_txt)

        return(ret)

    @RPC(roles="finance_read")
    def get(self, _id):
        return(self._get(_id))

    @RPC(roles="finance_admin")
    def delete(self, _id):

        doc=self._get(_id)

        #unlink all ticketobjects
        ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
                match={
                    "billing_contract_invoice": _id
                },
                fields=["billing_contract_invoice", "title"]
            )
        for ticket_object in ticket_objects:
            ticket_object["billing_contract_invoice"]=None
            call_rpc(self.context, 'ticket', 'TicketObjects', 'put', update_contract_invoice=False,**ticket_object)

        ret=self._delete(_id)
        self.recalc_minutes_balance(doc['relation'], doc['contract'])
        self.event("deleted",ret)

        self.info("Deleted contract invoice {desc}".format(**doc))

        return(ret)

    @RPC(roles="finance_read")
    def get_all(self, **params):
        return(self._get_all(**params))


    def list_to_csv(self,items):
        csv=""
        for item in items:
            stripped_cols=[]
            for col in item:
                if isinstance(col,str):
                    csv=csv+'"' + str(col).replace(";","_") + '";'
                else:
                    csv=csv+str(col)+';'

            csv=csv + "\n"

        return(csv)

    @RPC(roles="finance_read")
    def export_csv(self, relation_id,contract_id):

        relation=call_rpc(self.context, 'ticket', 'Relations', 'get', relation_id)
        contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', contract_id)


        contract_invoices=self._get_all(
            match={
                'relation': relation_id,
                'contract': contract_id
            },
            sort=[ ( "date", 1) ]
        )

        items=[]
        items.append([
            # "Order Date",
            "Order name",
            "Minutes used",
            "Minutes bought",
            "New budget balance",
            "Job date",
            "Job minutes",
            "Job description" ])

        #contract orders
        for contract_invoice in contract_invoices:
            items.append([
                # time.strftime(models.ticket.Invoices.invoice_date_format, time.localtime(contract_invoice['date'])),
                contract_invoice['desc'],
                contract_invoice['minutes_used'],
                contract_invoice['minutes_bought'],
                contract_invoice['minutes_balance'],
                "",
                "",
                "",
            ])

            #time booked under this contract order
            ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
                match={
                    "billing_contract_invoice": contract_invoice["_id"]
                },
                sort=[ ( "start_time", 1), ("create_time", 1) ]
            )

            for ticket_object in ticket_objects:

                #invoice description for this time
                invoice_desc=ticket_object['title'].rstrip()
                if ticket_object['minutes_factor']!=1:
                    invoice_desc=invoice_desc+" (calculated at {}% rate)".format(ticket_object['minutes_factor']*100)

                if 'start_time' in ticket_object and ticket_object["start_time"]:
                    work_time=ticket_object['start_time']
                else:
                    work_time=ticket_object['create_time']

                items.append([
                    # "",
                    "",
                    "",
                    "",
                    "",
                    time.strftime(models.ticket.Invoices.hours_format, time.localtime(work_time)),
                    self.round_minutes(ticket_object, contract),
                    invoice_desc,
                ])

        #create bottle-http response
        #doesnt seem to work correctly with Reponse, so we use HTTPResponse. bottle-bug?
        response=bottle.HTTPResponse(body=self.list_to_csv(items))
        file_name=relation["invoice"]["company"]+" budget and timesheet "+contract['title']+".csv"
        response.set_header('Content-Type', 'application/octet-stream')
        response.set_header('Content-Disposition', "attachment;filename="+file_name  );

        return(response)
