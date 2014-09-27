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


    @Acl(roles="finance")
    def recalc_minutes_balance(self, relation_id, contract_id):
        """recalculate budget of all contract invoices of specified relation,contract combo"""

        contract_invoices=self.get_all(
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
            if ('minutes_balance' not in contract_invoice) or (contract_invoice["minutes_balance"]!=minutes_balance):
                contract_invoice['minutes_balance']=minutes_balance
                self.put(
                    recalc_minutes_balance=False, #stop recursion
                    **contract_invoice
                    )



    def round_minutes(self, ticket_object, contract):
        """perform correct 'rounding' of minutes and factor correction"""
        minutes=ticket_object["minutes"]

        #make sure it has the minimum minutes
        if  minutes<contract['minutes_minimum']:
            minutes=contract['minutes_minimum']

        #apply factor 
        minutes=minutes*ticket_object['minutes_factor']

        #round up to whole minute-blocks
        #e.g when minutes_rounding=15:
        #14 becomes 15 minutes. but 16 becomes 30 minutes.
        minutes=((minutes+contract['minutes_rounding']-1)//contract['minutes_rounding'])*contract['minutes_rounding']

        return(minutes)


    @Acl(roles="user")
    #TODO: all users still need finance rights now 
    def recalc_minutes_used(self, _id):
        """recalculate minutes for one contract_invoice, by adding the minutes of all ticket objects that point to contract_invoice with this _id 

        rounds minutes according to round_minutes

        usually called by TicketObjects on change
        """

        if not _id:
            return

        doc=self.get(_id)
        contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=doc["contract"])

        #get used minutes and calculate total
        minutes_used=0
        ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
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
        self.put(**doc)


    # @Acl(roles="finance")
    # def auto_invoice_check(self):
    #     """check to see which contracts need to be auto invoiced. this is usually called by a cronjob"""


    #     if relation_id:
    #         relations=[ call_rpc(self.context, 'ticket', 'Relations', 'get', _id=relation_id) ]
    #     else:
    #         #all relations with contracts
    #         relations=call_rpc(self.context, 'ticket', 'Relations', 'get_all',
    #             fields=[ "contracts", "invoice" ], 
    #             spec_and=[ { 
    #                 "contracts": { 
    #                     "$not": { 
    #                         "$size": 0
    #                         }
    #                     }
    #                 } ]   
    #              )


    #     for relation in relations:

    #         #traverse all contracts for this relation
    #         for contract_id in relation["contracts"]:
    #            #get contract
    #             try:
    #                 contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_id)
    #             except:
    #                 #skip contracts we cant read
    #                 continue

    #             if not contract["active"]:
    #                 continue

    #             if contract["type"] not in [ "post", "prepay" ]:
    #                 continue

    #             #contracts are invoiced on the first day of the month, at 00:00
    #             contract_invoice_date=datetime.datetime(
    #                     year=datetime.datetime.now().year,
    #                     month=datetime.datetime.now().month,
    #                     day=1
    #                 )

    #             #check if its already generated for this month and relation,contract combo
    #             latest_contract_invoices=self.get_all(
    #                     match={
    #                         "relation": relation["_id"],
    #                         "contract": contract_id,
    #                         "date": contract_invoice_date.timestamp()
    #                     },
    #                     limit=1,
    #                     sort=[ ( 'date', -1 )]
    #                 )

        
    #             title=contract['title']+" "+contract_invoice_date.strftime("%B %Y")


    @Acl(roles="finance")
    def auto_invoice(self, relation_id, contract_id, desc):
        """automaticly collects un-invoiced ticket_objects, creates contract_invoice and an actual invoice"""

        contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_id)
        relation=call_rpc(self.context, 'ticket', 'Relations', 'get', _id=relation_id)

        contract_invoice={
            'date': datetime.datetime.now().timestamp(),
            'desc': desc,
            'allowed_users': [ self.context.session['user_id'] ],
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
                'tax': relation['invoice']['tax']
            })

        #get uninvoiced ticket_objects for this relation,contract combo
        ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
            fields=["title", "minutes", "minutes_factor" ],
            match={
                "billing_relation": relation["_id"],
                "billing_contract": contract_id,
                "billing_contract_invoice": None,
            })

        #now create contract invoice, so we have the _id
        contract_invoice=self.put(**contract_invoice)

        #traverse all the un-invoiced ticket_objects
        for ticket_object in ticket_objects:
            minutes=self.round_minutes(ticket_object, contract)

            #determine price:
            if contract['type']=='post':
                #post: pay per hour
                price=(contract['price']*minutes)/contract['minutes']
            elif contract['type']=='prepay':
                #prepayed: fixed price per month, not per hour
                price=0

            #invoice description for this time
            invoice_desc="["+contract['title']+"] "+ticket_object['title']
            if ticket_object['minutes_factor']!=1:
                invoice_desc=invoice_desc+" \n(calculated at {}% rate)".format(ticket_object['minutes_factor']*100)

            #append to invoice
            invoice_items.append({
                'amount': round(minutes/60,2),
                'desc':invoice_desc,
                'price': round(price,2),
                'tax': relation['invoice']['tax']
            })

            #update minutes used and bought
            contract_invoice['minutes_used']+=minutes
            if contract['type']=='post':
                contract_invoice['minutes_bought']+=minutes

            #point the ticket_object to the current contract_invoice
            ticket_object['billing_contract_invoice']=contract_invoice['_id']
            call_rpc(self.context, 'ticket', 'TicketObjects', 'put', update_contract_invoice=False, **ticket_object)


        #create actual invoice
        invoice=call_rpc(self.context, 'ticket', 'Invoices', 'add_items', 
             to_relation=relation['_id'],
             currency=contract['currency'],
             items=invoice_items
        )

        #finally update contract_invoice 
        contract_invoice['invoice']=invoice['_id']
        contract_invoice=self.put(**contract_invoice)

        return(contract_invoice)

    @Acl(roles="user")
    def get_used_contracts(self, relation_id):
        '''get unique list of used contract_ids for specified relation'''

        return(
            self.db[self.default_collection].
                find({ "relation" : bson.objectid.ObjectId(relation_id) }).
                distinct("contract")
        )


    @Acl(roles="finance")
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
            latest_contract_invoices=self.get_all(
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
            ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
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


    @Acl(roles="finance")
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

    @Acl(roles="finance")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="finance")
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

    @Acl(roles="finance")
    def get_all(self, **params):
        return(self._get_all(**params))

