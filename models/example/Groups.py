from models.common import *
import fields
import models.mongodb


class Groups(models.mongodb.MongoDB):
    '''Demonstrates relations: A Group is a thing Members can point to. (look there for the actual relation definition) '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(desc='Name'),
            }),
            list_key='_id'
        )

    @Acl(groups="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed group {}".format(doc['name'])
        else:
          log_txt="Created group {}".format(doc['name'])

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

        self.info("Deleted group {}".format(doc['name']))

        return(ret)

    @Acl(groups="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

