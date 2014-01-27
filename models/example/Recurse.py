from models.common import *
import fields
import models.mongodb


class Recurse(models.mongodb.Base):
    '''example that demonstrates recursive relation.'''
    


    def __init__(self, context=None):
        self.meta = fields.List(
                fields.Dict({
                    '_id': models.mongodb.FieldId(),
                    'name': fields.String(desc='Item name'),
                    'item_ids': models.mongodb.Relation(
                        desc='Parent items this item belongs to',
                        model=models.example.Recurse.Recurse,
                        resolve=False) #NOTE: self referring relations cannot be resolved server side. its tricky and would allow loops while resolving.
                }),
                list_key='_id'
            )

        super(Recurse, self).__init__(context=context)

        #name should be unique..let db enforce this.
        self.db[self.default_collection].ensure_index( 'name', unique=True )


    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed member {}".format(doc['name'])
        else:
          log_txt="Created member {}".format(doc['name'])

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

        self.info("Deleted member {}".format(doc['name']))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        '''get all the members'''
        return(self._get_all(**params))

