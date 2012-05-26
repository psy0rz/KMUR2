import models.common
import models.field
import pymongo
import bson.objectid


class FieldId(models.field.Base):
    '''A mongodb ObjectId field. Respresented in string form'''
    
    def __init__(self, type='mongodb.id', **kwargs):

        super(Field, self).__init__(type=type, **kwargs)
        

    def check(self,data):
        
        super(FieldId,self).check(data)

        if not isinstance(data, str):
            raise FieldException("id should be a string")
       
        if str(bson.objectid.ObjectId(data))!=data:
            raise FieldException("invalid id")
        

class MongoDB(models.common.Base):
    """Base class for models that use mongodb.
    
    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.db_name as database name.
    
    self.db is also stored in the context.cache so that multiple models can use the same database instance.
    """
    def __init__(self, context=None):
        super(MongoDB, self).__init__(context=context)

        if not 'mongodb_connection' in context.cache:
            context.cache['mongodb_connection']=pymongo.Connection(host=context.db_host)

        self.db=context.cache['mongodb_connection'][context.db_name]
        
        

