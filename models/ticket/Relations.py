from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb

class Relations(models.core.Protected.Protected):
    '''Relations (these can be customers/companies or other contacts)'''
    

    write={
        'allowed_groups': {
            'context_field': 'group_ids',
            'set_on_create': False,
            'check': True
        },
        'allowed_users': {
            'context_field': 'user_id',
            'set_on_create': False,
            'check': True
        },
    }

    read=write

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'title': fields.String(min=3, desc='Title'),
                'desc': fields.String(desc='Description'),
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
                'emails': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'email': fields.Email(desc='Email address')
                        }),
                    desc="Email adresses"
                ),
                'phones': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'phone': fields.Phone(desc='Phone number')
                        }),
                    desc="Phone numbers"
                ),
            }),
            list_key='_id'
        )

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed relation {title}".format(**doc)
        else:
          log_txt="Created new relation {title}".format(**doc)

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

        self.info("Deleted relation {title}".format(**doc))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

