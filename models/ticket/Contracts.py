from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.InvoiceSettings

class Contracts(models.core.Protected.Protected):
    '''Hourly billing contracts with relations. 

    used to book time for customers and add it to invoices
    '''

    @Acl(roles=["everyone"])
    def get_meta(self, *args, _id=None, **kwarg):    
        meta = fields.List(
                fields.Dict({
                    '_id': models.mongodb.FieldId(),
                    'auto': fields.Select(desc="Auto invoice",
                                                          choices=[
                                                          ("never", "Never"),
                                                          ("monthly", "Every month"),
                                                        ]),
                    'title': fields.String(min=3, desc='Title', size=100),
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
                    'type': fields.Select(desc="Billing",
                                                          choices=[
                                                          ("post", "Pay per hour"),
                                                          ("prepay", "Prepay"),
                                                          ("manual", "Manual"),
                                                        ]),
                    'price': fields.Number(desc='Price', decimals=2),
                    'currency': fields.String(desc='Currency', default=models.ticket.InvoiceSettings.InvoiceSettings(self.context)['currency']),
                    'minutes': fields.Number(desc='Time', default=60),
                    'minutes_minimum': fields.Number(desc='Minimal minutes', default=0),
                    'minutes_rounding': fields.Number(desc='Minutes round up per', default=1, min=1),
                    'tax': fields.Number(desc='Tax', default=21),
                    'import_id': fields.String(desc='Import ID'),

                    'invoice_notes_format': fields.String(desc='Invoice notes to add',default="""{contract_title} {desc} details:
 Used: {minutes_used}m
 Bought: {minutes_bought}m
 New budget: {minutes_balance}m

"""),
                    'invoice_details': fields.Select(desc="Invoice details",
                                                          choices=[
                                                          ("time", "Add time specification"),
                                                          ("none", "None"),
                                                        ]),

                }),
                list_key='_id'
            )
        return(meta)

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

    @Acl(roles="finance")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed contract {title}".format(**doc)
        else:
          log_txt="Created new contract {title}".format(**doc)


        if doc["type"]=="manual" and doc["auto"]!="never":
            raise fields.FieldError("Cant auto invoice with manual billing.","type")


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

