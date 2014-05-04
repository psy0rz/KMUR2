from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb

class Contracts(models.core.Protected.Protected):
    '''Hourly billing contracts with relations. 

    used to book time for customers and add it to invoices
    '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'active': fields.Bool(desc='Active', default=1),
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
                                                      ("post", "Post"),
                                                      ("prepay", "Prepayed montly"),
                                                    ]),
                'price': fields.Number(desc='Price'),
                'currency': fields.String(desc='Currency', default='€'),
                'minutes': fields.Number(desc='Time', default=60),
                'minutes_minimum': fields.Number(desc='Minimal minutes', default=0),
                'minutes_rounding': fields.Number(desc='Minutes round up per', default=15),
                'tax': fields.Number(desc='Tax', default=21),
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

