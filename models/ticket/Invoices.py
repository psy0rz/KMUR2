from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.Relations
import models.ticket.InvoiceSettings

class Invoices(models.core.Protected.Protected):
    '''Invoicing module
    '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),

                'title': fields.String(desc='Title', default='Invoice'),

                #filled automatcly when invoice is "sent"
                #after sending, most of the invoice may no longer be changed
                'invoice_nr': fields.Number(desc='Invoice number'),
                'sent': fields.Bool(desc='Sent'),
                'sent_date': fields.Timestamp(desc='Invoice date'),

                #filled automaticly when invoice is "payed"
                'payed': fields.Bool(desc='Payed'),
                'payed_date': fields.Timestamp(desc='Payed date'),


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

                'from_relation': models.mongodb.Relation(
                    desc='From',
                    model=models.ticket.Relations.Relations,
                    resolve=False,
                    check_exists=True,
                    list=False),
                'to_relation': models.mongodb.Relation(
                    desc='Customer',
                    model=models.ticket.Relations.Relations,
                    resolve=False,
                    check_exists=True,
                    list=False),

                #invoice-data should be immutable once they're sent to the customer
                'from_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],
                'to_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],

                'items': fields.List(
                    fields.Dict({
                            'amount': fields.Number(desc='Amount',size=5),
                            'desc': fields.String(desc='Description', size=80),
                            'price': fields.Number(desc='Price', size=5),
                            'tax': fields.Number(desc='Tax', default=21, size=5),
                        }),
                    desc="Invoice items"
                ),


                'notes': fields.String(desc='Notes'),

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

    @Acl(roles="finance")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed relation {title}".format(**doc)
        else:
          log_txt="Created new relation {title}".format(**doc)

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

        self.info("Deleted relation {title}".format(**doc))

        return(ret)

    @Acl(roles="finance")
    def get_all(self, **params):
        return(self._get_all(**params))

