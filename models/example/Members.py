from models.common import *
import fields
import models.mongodb

import models.example.Groups

class Members(models.mongodb.MongoDB):
    '''example that demonstrates relations. Members can point to one or more Groups. (N:N relation) '''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(desc='Member name'),
                'group_ids': models.mongodb.Relation(
                    desc='Group list, resolved server side',
                    model=models.example.Groups.Groups,
                    resolve=True,
                    list=True,
                    min=1,
                    max=3),
                'group_ids2': models.mongodb.Relation(
                    desc='Group2 list, resolved client side',
                    model=models.example.Groups.Groups,
                    resolve=False,
                    list=True),
                'group_id': models.mongodb.Relation(
                    desc='One group, resolved server side',
                    model=models.example.Groups.Groups,
                    resolve=True,
                    list=False),
                'group_id2': models.mongodb.Relation(
                    desc='One group2, resolved client side',
                    model=models.example.Groups.Groups,
                    resolve=False,
                    list=False)
            }, desc='A member'),
            desc='A list of members',
            list_key='_id'
        )


    def __init__(self, context=None):
        super(Members, self).__init__(context=context)

        #name should be unique..let db enforce this.
        self.db[self.default_collection].ensure_index( 'name', unique=True )


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

