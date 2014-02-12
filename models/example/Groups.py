from models.common import *
import fields
import models.mongodb


class Groups(models.mongodb.Base):
    '''Demonstrates relations: A Group is a thing Members can point to. (look there for the actual relation definition) '''
    
    meta = fields.List(
                fields.Dict({
                    '_id': models.mongodb.FieldId(),
                    'name': fields.String(desc='Group name'),

                },
                desc='One group'),
            desc='List of groups',
            list_key='_id'
        )

    def __init__(self, context=None):
        super(Groups, self).__init__(context=context)

        #name should be unique..let db enforce this.
        self.db[self.default_collection].ensure_index( 'name', unique=True )

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed group {}".format(doc['name'])
        else:
          log_txt="Created group {}".format(doc['name'])

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)

        return(ret)

    @Acl(roles="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)
        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted group {}".format(doc['name']))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

