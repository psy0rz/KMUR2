from models.common import *
import fields
import models.mongodb
from models import mongodb


class Companies(models.mongodb.Base):
    '''company management'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(min=1, desc='Company name'),
            }),
            list_key='_id'
        )


    @Acl(groups="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed company {}".format(doc['name'])
        else:
          log_txt="Created new user {}".format(doc['name'])

        ret=self._put(doc)

        self.info(log_txt)

        return(ret)

    @Acl(groups="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(groups="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted company {}".format(doc['name']))

        return(ret)

    @Acl(groups="admin")
    def get_all(self, **params):
        return(self._get_all(**params))
