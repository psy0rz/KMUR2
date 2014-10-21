from models.common import *
import fields
import models.mongodb
from models import mongodb
import models.core.Protected



class Groups(models.core.Protected.Protected):
    '''group management'''

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(min=1, desc='Group name')
            }),
            list_key='_id'
        )

    write={
        '_id': {
            'context_field': 'group_ids',
            'check': True
        },
    }
    read=write

    admin_read_roles=[ "admin" ]
    admin_write_roles=admin_read_roles


    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed group {name}".format(**doc)
        else:
          log_txt="Created new group {name}".format(**doc)

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)

        return(ret)

    @Acl(roles="user")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted group {}".format(doc['name']))

        return(ret)

    @Acl(roles="user")
    def get_all(self, **params):
        return(self._get_all(**params))

