from models.common import *
import fields
import models.mongodb
import bson.objectid


### Super-class, do not use directly.
class UserSettings(models.mongodb.Base):
    """Settings per user

    Can be accesses magically by using accesing it as a dict, and can also be accessed via the normal API by endusers with the correct roles. (default user)
    """


    admin_read_roles=["user"]
    admin_write_roles=["user"]


    def __init__(self, context=None):
        super(UserSettings, self).__init__(context=context)

    @RPC(roles=admin_write_roles)
    def put(self, **doc):

        if '_id' in doc:
            raise fields.FieldError("Cant set _id when storing user settings","_id")

        self.get_meta(doc).meta['meta'].check(self.context, doc)
        doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)

        collection = self.default_collection
        ret=self.db[collection].update(
            {'_id': bson.objectid.ObjectId(self.context.session['user_id'])},
            {'$set' : doc },
            upsert=True)
        self.event("changed",doc)
        self.info("Changed user settings for {}".format(self.__class__.__module__))
        return(doc)

    @RPC(roles=admin_read_roles)
    def get(self):

        collection = self.default_collection
        doc = self.db[collection].find_one(bson.objectid.ObjectId(self.context.session['user_id']))
        doc = self.get_meta(doc).meta['meta'].ensure_defaults(self.context, doc)

        if not doc:
            return({})
        else:
            return(self.get_meta(doc).meta['meta'].to_external(self.context, doc))


    def __getitem__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(bson.objectid.ObjectId(self.context.session['user_id']), projection={ key: True } )

        if doc and key in doc:
            return(doc[key])

        #return default value, if any
        return(self.get_meta(doc).meta['meta'].meta['meta'][key].meta['default'])

    def __contains__(self, key):
        collection = self.default_collection
        doc = self.db[collection].find_one(bson.objectid.ObjectId(self.context.session['user_id']), projection={ key: True } )
        if key in doc:
            return(True)

        #return true if the metadata exists and has a default value
        if key in self.get_meta(doc).meta['meta'].meta['meta']:
            if default in self.get_meta(doc).meta['meta'].meta['meta'][key].meta:
                return(True)

        return(False)


    def __setitem__(self, key, value):

        if key=='_id':
            raise fields.FieldError("Cant set _id when storing user settings","_id")

        collection = self.default_collection
        self.db[collection].update(
            {'_id':bson.objectid.ObjectId(self.context.session['user_id'])},
            {'$set' : {
                key: value
            } },
            upsert=True)
