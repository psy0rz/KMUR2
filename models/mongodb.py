import models.common
import fields
import pymongo
import bson.objectid


class FieldId(fields.Base):
    '''A mongodb ObjectId field. Respresented in string form'''
    
    def __init__(self, type='mongodb.id', **kwargs):

        super(FieldId, self).__init__(type=type, **kwargs)
        

    def check(self,data):
        
        super(FieldId,self).check(data)

        if not isinstance(data, str):
            raise fields.FieldException("id should be a string")
       
        if str(bson.objectid.ObjectId(data))!=data:
            raise fields.FieldException("invalid id")
        

class MongoDB(models.common.Base):
    """Base class for models that use mongodb.
    
    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.db_name as database name.
    
    self.db is also stored in the context.cache so that multiple models can use the same database instance.
    """


    def __init__(self, context=None):
        super(MongoDB, self).__init__(context=context)

        if not 'mongodb_connection' in context.cache:
            context.cache['mongodb_connection']=pymongo.Connection(host=context.db_host, safe=True)

        self.db=context.cache['mongodb_connection'][context.db_name]
        

    def get_meta(self, doc):
        """Return the metadata for this model
        
        Implement this function in your own subclass.
        
        Usually this is a mandatory function thats used by the views as well to get the metadata.

        Fields may also be dynamic and returns different fields for different parameters. 
        Usually the document will be passed as params, so you can for example use the _id field to find the document and change the metadata according 
        to the state of the document.

        You can also specify different fields when you call _put
        """
        return(fields.Nothing())
        

        
    def _put(self, collection, doc, meta=None, replace=False):
        """Checks document with field and replaces, updates or inserts it into collection

        If meta is set, the check function of that object will be used. 
        Otherwise self.getMeta(doc) will be called to get the default meta.
        
        If _id is not set the document is inserted.
        
        If _id is set, an existing document will be updated. 
        If the _id is a string it will be automaticly converted to a mongo ObjectId.
        
        If the specified document does not exist it will raise and exception.
        
        If replace is True then the existing document will be replaced, otherwise only the specified keys are updated.
        
        """
        if meta:
            meta.check(doc)
        else:
            self.get_meta(doc).check(doc)

        
        #add new
        if not '_id' in doc:
            self.db[collection].insert(doc, manipulate=True, safe=True, check_keys=True)
            
        #use existing document
        else:
            doc['_id']=bson.objectid.ObjectId(doc['_id'])

            if replace:            
                self.db[collection].update({'_id':doc['_id']}, doc, multi=False, safe=True )
            else:
                self.db[collection].update({'_id':doc['_id']}, {'$set': doc}, multi=False, safe=True )

        return(doc)

    def _get(self, collection, _id):
        '''get the specified _id from the collection.
        
        throws exeception if not found
        '''
       
        doc=self.db[collection].find_one( bson.objectid.ObjectId(_id) )
       
        if not doc:
            raise Exception("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))
       
        return doc


    def _delete(self,collection, _id):
        
        return self.db[collection].remove(bson.objectid.ObjectId(_id), safe=True)
        
        