from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb

class Relations(models.core.Protected.Protected):
    '''Real-life relations (these can be customers/companies or other contacts)

    dont confuse this with mongodb-relations :)
    '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'title': fields.String(min=3, desc='Title'),
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

    @Acl(roles="user")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed relation {title}".format(**doc)
        else:
          log_txt="Created new relation {title}".format(**doc)

        ret=self._put(doc)

        self.info(log_txt)

        return(ret)

    @Acl(roles="user")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="user")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted relation {title}".format(**doc))

        return(ret)

    @Acl(roles="user")
    def get_all(self, **params):
        return(self._get_all(**params))

