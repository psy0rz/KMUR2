from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.Contracts
import models.ticket.Invoices
import models.ticket.Relations

class ContractInvoices(models.core.Protected.Protected):
    '''Keeps a record of all hours that where already bought and invoiced.

    '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'create_date': fields.Timestamp(desc='Date'),
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
    def invoice_all(self):
        """invoice all contracts and open hours"""


        #all relations with contracts
        relations=call_rpc(self.context, 'ticket', 'Relations', 'get_all',
            fields=[ "contracts" ], 
            spec_and=[ { 
                "contracts": { 
                    "$not": { 
                        "$size": 0
                        }
                    }
                } ]   
             )


        for relation in relations:
            for contract in relation["contracts"]:
                #get uninvoiced hours for this relation,contract combo
                hours=call_rpc(self.context, 'ticket', 'TicketObjects', 'get_all', 
                    fields=["title", "minutes"],
                    match={
                        "billing_relation": relation["_id"],
                        "billing_contract": contract,
                        "billing_invoiced": False,
                    })
                self.debug(hours)

        #nadenken over correcties ...

    @Acl(roles="finance")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed contract {title}".format(**doc)
        else:
          log_txt="Created new contract {title}".format(**doc)

        ret=self._put(doc)
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
        self.event("deleted",ret)

        self.info("Deleted contract {title}".format(**doc))

        return(ret)

    @Acl(roles="finance")
    def get_all(self, **params):
        return(self._get_all(**params))

