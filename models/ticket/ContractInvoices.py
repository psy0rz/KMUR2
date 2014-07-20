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
                'date': fields.Timestamp(desc='Date'),
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
                    resolve=False,
                    check_exists=True,
                    list=False),
                'contract': models.mongodb.Relation(
                    desc='Contract',
                    model=models.ticket.Contracts.Contracts,
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
                'minutes_used': fields.Number(desc='Used minutes'),
                'minutes_bought': fields.Number(desc='Bought minutes'),
                #balance should usually be 0 in post-payed contracts, and can be negative in pre-payed.
                'minutes_balance': fields.Number(desc='Balance'), 
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


    # @Acl(roles="finance")


    # def get_(self, **doc):

    @Acl(roles="finance")
    def recalc_budget(self, relation, contract):
        """recalculate budget of all contract invoices of specified relation,contract combo"""

        contract_invoices=self.get_all(
                match={
                "relation": relation,
                "contract": contract,
                },
                fields=[ "minutes_used", "minutes_bought", "minutes_balance", "desc" ], 
                sort=[ ( 'date', 1 )]
            )

        minutes_balance=0
        for contract_invoice in contract_invoices:
            minutes_balance+=contract_invoice['minutes_bought']-contract_invoice['minutes_used']
            if contract_invoice["minutes_balance"]!=minutes_balance:
                contract_invoice['minutes_balance']=minutes_balance
                self.put(
                    **contract_invoice
                    )



    @Acl(roles="finance")
    def invoice_all(self):
        """invoice all contracts and open hours"""


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
                contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=contract_id)

                #get the last contract_invoice that was generated for this relation,contract combo:
                latest_contract_invoices=self.get_all(
                        match={
                        "relation": relation["_id"],
                        "contract": contract_id,
                        },
                        limit=1,
                        sort=[ ( 'date', -1 )]
                    )

                #contracts are invoiced on the first day of the month, at 00:00
                contract_invoice_date=datetime.datetime(
                        year=datetime.datetime.now().year,
                        month=datetime.datetime.now().month,
                        day=1
                    )

                #should we generate this the contract_invoice of this month?
                if len(latest_contract_invoices)==0 or contract_invoice_date.timestamp()!=latest_contract_invoices[0]['date']:
                    title=contract['title']
                    contract_invoice={
                        'date': contract_invoice_date.timestamp(),
                        'desc': contract_invoice_date.strftime("%B %Y"),
                        'allowed_users': [ self.context.session['user_id'] ],
                        'relation': relation['_id'],
                        'contract': contract['_id'],
                        'minutes_used': 0,
                        'minutes_bought':0,
                    }

                    #determine current minutes-balance
                    if len(latest_contract_invoices)==0:
                        contract_invoice['minutes_balance']=0
                    else:
                        contract_invoice['minutes_balance']=latest_contract_invoices[0]['minutes_balance']

                    #we put the contract_invoice a lot of times to keep things in a usefull state if something fails
                    contract_invoice=self.put(**contract_invoice)

                    if contract['type']=='prepay':
                        #add prepayed contract price to invoice
                        invoice=call_rpc(self.context, 'ticket', 'Invoices', 'add_items', 
                             to_relation=relation['_id'],
                             items=[{
                                'amount': 1,
                                'desc':title,
                                'price': contract['price'],
                                'tax': relation['invoice']['tax']
                             }]
                        )
                        #update contract_invoice 
                        contract_invoice['invoice']=invoice['_id']
                        contract_invoice['minutes_balance']+=contract['minutes']
                        contract_invoice['minutes_bought']=contract['minutes']
                        contract_invoice=self.put(**contract_invoice)

                    #get uninvoiced hours for this relation,contract combo
                    ticket_objects=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all',
                        fields=["title", "minutes"],
                        match={
                            "billing_relation": relation["_id"],
                            "billing_contract": contract_id,
                            "billing_invoiced": False,
                        })

                    #traverse all the un-invoiced ticket_objects
                    for ticket_object in ticket_objects:
                        #make sure it has the minimum minutes
                        minutes=ticket_object['minutes']
                        if  minutes<contract['minutes_minimum']:
                            minutes=contract['minutes_minimum']

                        #round up to whole minute-blocks
                        #e.g when minutes_rounding=15:
                        #14 becomes 15 minutes. but 16 becomes 30 minutes.
                        minutes=((minutes+contract['minutes_rounding']-1)//contract['minutes_rounding'])*contract['minutes_rounding']

                        #determine price:
                        if contract['type']=='post':
                            price=(contract['price']*minutes)/contract['minutes']
                        elif contract['type']=='prepay':
                            price=0
                        else:
                            raise fields.FieldError("Unknown contract type: "+contract['type'])

                        #add to invoice
                        invoice=call_rpc(self.context, 'ticket', 'Invoices', 'add_items', 
                             to_relation=relation['_id'],
                             items=[{
                                'amount': minutes/60,
                                'desc':"["+contract['title']+"] "+ticket_object['title'],
                                'price': price,
                                'tax': relation['invoice']['tax']
                             }]
                        )

                        #update minutes used and bought and invoice id
                        contract_invoice['minutes_used']+=minutes
                        contract_invoice['invoice']=invoice['_id']
                        if contract['type']=='post':
                            contract_invoice['minutes_bought']+=minutes
                        elif contract['type']=='prepay':
                            contract_invoice['minutes_balance']-=minutes
                        contract_invoice=self.put(**contract_invoice)

                        #update ticket_object
                        ticket_object['billing_invoiced']=True
                        ticket_object['billing_contract_invoice']=contract_invoice['_id']
                        call_rpc(self.context, 'ticket', 'TicketObjects', 'put', **ticket_object)

    @Acl(roles="finance")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed contract invoice {desc}".format(**doc)
        else:
          log_txt="Created new contract invoice {desc}".format(**doc)

        if 'contract' in doc:
            contract=call_rpc(self.context, 'ticket', 'Contracts', 'get', _id=doc['contract'])
            doc['contract_title']=contract['title']

        ret=self._put(doc)

        if 'relation' in doc and 'contract' in doc:
            self.recalc_budget(doc['relation'], doc['contract'])

        self.event("changed",ret)
        self.info(log_txt)

        return(ret)

    @Acl(roles="finance")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="finance")
    def delete(self, _id):

        doc=self._get(_id)
        ret=self._delete(_id)
        self.recalc_budget(doc['relation'], doc['contract'])
        self.event("deleted",ret)

        self.info("Deleted contract invoice {desc}".format(**doc))

        return(ret)

    @Acl(roles="finance")
    def get_all(self, **params):
        return(self._get_all(**params))

