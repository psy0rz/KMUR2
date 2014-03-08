from models.common import *
import fields
import models.mongodb


class ModuleSettings(models.mongodb.Base):
    """Global settings per module.

    Can be accesses magically by using accesing it as a dict, and can also be accessed via the normal API by endusers with the correct roles. (default admin)
    """


    read_roles=["admin"]
    write_roles=["admin"]


    def __init__(self, context=None):
        super(ModuleSettings, self).__init__(context=context)

    @Acl(roles=write_roles)
    def put(self, **doc):

        self.get_meta(doc).meta['meta'].check(self.context, doc)
        doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)

        collection = self.default_collection
        ret=self.db[collection].update(
            {'_id':0}, 
            {'$set' : doc }, 
            upsert=True)
        self.event("changed",doc)
        self.info("Changed module settings for {}".format(self.__class__.__module__))
        return(doc)

    @Acl(roles=read_roles)
    def get(self):

        collection = self.default_collection
        doc = self.db[collection].find_one(0)

        if not doc:
            return({})
        else:
            return(self.get_meta(doc).meta['meta'].to_external(self.context, doc))


    def __getitem__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(0, fields={ key: True } )
        return(doc[key])

    def __contains__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(0, fields={ key: True } )
        return(key in doc)

    def __setitem__(self, key, value):
        collection = self.default_collection
        self.db[collection].update(
            {'_id':0}, 
            {'$set' : {
                key: value
            } }, 
            upsert=True)


