from models.common import *
import fields
import models.mongodb

import models.example.Groups

class Members(models.mongodb.MongoDB):
    '''example that demonstrates relations. Members can point to one or more Groups. (N:N relation) '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(desc='Name'),
                'group_ids': models.mongodb.Relation(
                    desc='Groups this member belongs to',
                    model=models.example.Groups.Groups),
                'group_ids2': models.mongodb.Relation(
                    desc='Groups this member belongs to (without resolving)',
                    model=models.example.Groups.Groups,
                    resolve=False)
            }),
            list_key='_id'
        )

    @Acl(groups="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed member {}".format(doc['name'])
        else:
          log_txt="Created member {}".format(doc['name'])

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

        self.info("Deleted member {}".format(doc['name']))

        return(ret)

    @Acl(groups="admin")
    def get_all(self, **params):
        '''get all the members'''
        return(self._get_all(**params))
