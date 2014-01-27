from models.common import *
import fields
import models.mongodb
from models import mongodb


class Groups(models.mongodb.Base):
    '''group management'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(min=1, desc='Group name')
            }),
            list_key='_id'
        )

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed group {name}".format(**doc)
        else:
          log_txt="Created new group {name}".format(**doc)

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

        self.info("Deleted group {}".format(doc['name']))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

