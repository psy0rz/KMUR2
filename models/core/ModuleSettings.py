from models.common import *
import fields
import models.mongodb


### Super-class, do not use directly.
class ModuleSettings(models.mongodb.Base):
    """Global settings per module.

    Can be accesses magically by using accesing it as a dict, and can also be accessed via the normal API by endusers with the correct roles. (default admin)
    """


    admin_read_roles=["admin"]
    admin_write_roles=["admin"]


    def __init__(self, context=None):
        super(ModuleSettings, self).__init__(context=context)

    @RPC(roles=admin_write_roles)
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

    @RPC(roles=admin_read_roles)
    def get(self):

        collection = self.default_collection
        doc = self.db[collection].find_one(0)
        doc = self.get_meta(doc).meta['meta'].ensure_defaults(self.context, doc)

        if not doc:
            return({})
        else:
            return(self.get_meta(doc).meta['meta'].to_external(self.context, doc))


    def __getitem__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(0, projection={ key: True } )

        if doc and key in doc:
            return(doc[key])

        #return default value, if any
        return(self.get_meta(doc).meta['meta'].meta['meta'][key].meta['default'])

    def __contains__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(0, projection={ key: True } )
        if key in doc:
            return(True)

        #return true if the metadata exists and has a default value
        if key in self.get_meta(doc).meta['meta'].meta['meta']:
            if default in self.get_meta(doc).meta['meta'].meta['meta'][key].meta:
                return(True)

        return(False)


    def __setitem__(self, key, value):
        collection = self.default_collection
        self.db[collection].update(
            {'_id':0},
            {'$set' : {
                key: value
            } },
            upsert=True)
