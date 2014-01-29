from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb

class Tickets(models.core.Protected.Protected):
    '''ticket system'''
    

    write={
        'allowed_groups': {
            'context_field': 'group_ids',
            'set_on_create': False,
            'check': True
        },
        'allowed_users': {
            'context_field': 'user_id',
            'set_on_create': True,
            'check': True
        },
    }

    read=write

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'title': fields.String(min=3, desc='Ticket description'),
                'allowed_groups': models.mongodb.Relation(
                    desc='Groups with access',
                    model=models.core.Groups.Groups,
                    resolve=False,
                    list=True),
                'allowed_users': models.mongodb.Relation(
                    desc='Users with access',
                    model=models.core.Users.Users,
                    resolve=False,
                    list=True),
            }),
            list_key='_id'
        )

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed ticket {title}".format(**doc)
        else:
          log_txt="Created new ticket {title}".format(**doc)

        ret=self._put(doc)

        self.info(log_txt)

        return(ret)

    @Acl(roles="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted ticket {ticket}".format(**doc))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

