import models.common
import fields
import pymongo
import bson.objectid
import re


class NotFound(Exception):
    pass




#add function to bson objectid class, so that the json converter can convert them to a string
def _to_builtin(self):
    return str(self)
bson.objectid.ObjectId._to_builtin=_to_builtin


#add function to pymongo cursor, so that the json converter can convert them to a string
def _to_builtin(self):
    return list(self)
pymongo.cursor.Cursor._to_builtin=_to_builtin


class FieldId(fields.Base):
    '''A mongodb ObjectId field. May be respresented in string form or as real ObjectId'''

    def __init__(self, **kwargs):

        super(FieldId, self).__init__(**kwargs)

    def check(self, context, data):

        if not super(FieldId, self).check(context, data):
            return

        if not isinstance(data, (str, bson.objectid.ObjectId)):
            raise fields.FieldException("id should be a string or bson.ObjectId")

        if str(bson.objectid.ObjectId(data)) != data:
            raise fields.FieldException("invalid id")

    def to_internal(self, context, data):
        """converts input data to an actual internal bson objectid"""
        return(bson.objectid.ObjectId(data))


class Relation(fields.Base):
    '''A relation field that contains one or more id's that point objects in another model

    All ids will be checked to see if they exist in the other model

    NOTE: In the future there can be other database relation-implementations with the same name in a different module. The gui shouldnt note a difference theoretically. 
    '''


    def __init__(self, model, meta=None, resolve=True , **kwargs):
        """
            model: specifies the related model (as a python object)
            meta: Metadata of related data. If not specified then model.meta is used. you can specify this in case you want dynamic metadata vs static.
            resolve: resolve ids to foreign data and back. (when calling _get and _put)

        """

        super(Relation, self).__init__(**kwargs)

        if meta==None:
            self.meta['meta']=model.meta

        self.meta['resolve']=resolve
        self.meta['model']=model.__module__.replace("models.","") #TODO: use regex
        self.model=model



    def check(self, context, data):

        if not super(Relation, self).check(context, data):
            return

        if not isinstance(data, list):
            raise fields.FieldException("this field should be a list")


        #check mongo ID's validity
        mongo_ids=[]
        if self.meta['resolve']==False:
            #data is just a list of id's in string format:
            for id in data:
                mongo_id=bson.objectid.ObjectId(id)
                if str(mongo_id) != id:
                    raise fields.FieldException("the list contains an invalid id")

                mongo_ids.append(mongo_id)

        else:
            #data is a list of foreign documents
            list_key=self.meta['meta'].meta['list_key']

            for doc in data:
                mongo_id=bson.objectid.ObjectId(doc[list_key])
                if str(mongo_id) != doc[list_key]:
                    raise fields.FieldException("the list contains an invalid id")

                mongo_ids.append(mongo_id)


        #call foreign model to check if all id's exist
        foreign_object=self.model(context)
        result=foreign_object._get_all(
                fields='_id', 
                spec={
                '_id': {
                        '$in': mongo_ids
                    }
                });

        #TODO: specify which id in case resolve is true? (altough this error should never happen)
        if result.count()!=len(data):
            raise fields.FieldException("an item in the list doesnt exist")


    def to_internal(self, context, data):
        """convert a list of object ids from input data to actual bson objectids

        if resolve is True then we 'unresolve' the relation back to normal object ids.
        """

        mongo_ids=[]
        if self.meta['resolve']==False:
            #data is just a list of id's in string format:
            for id in data:
                mongo_id=bson.objectid.ObjectId(id)
                mongo_ids.append(mongo_id)

        else:
            #data is a list of foreign documents
            list_key=self.meta['meta'].meta['list_key']

            for doc in data:
                mongo_id=bson.objectid.ObjectId(doc[list_key])
                mongo_ids.append(mongo_id)

        return(mongo_ids)


    def to_external(self, context, data):
        """resolve a list of bson objectids by calling the external model to get the corresponding data

        (only when resolve is True) """

        if self.meta['resolve']==False:
            return(data)

        foreign_object=self.model(context)
        result=foreign_object._get_all(
                spec={
                '_id': {
                        '$in': data
                    }
                });

        return(result)


class MongoDB(models.common.Base):
    """Base class for models that use mongodb.

    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.db_name as database name and context.db_host as the host.

    self.db is also stored in the context so that multiple models can use the same database instance,
    instead of using seperate connections to the database.
    

    """

    def __init__(self, context=None):
        super(MongoDB, self).__init__(context=context)

        if not hasattr(context, 'mongodb_connection'):
            context.mongodb_connection = pymongo.Connection(host=context.db_host, safe=True)

        self.db = context.mongodb_connection[context.db_name]

        self.default_collection = self.__class__.__module__

    def _put(self, doc, meta=None, replace=False):
        """Checks document with field and replaces, updates or inserts it into collection

        If meta is set, the check function of that object will be used.
        Otherwise self.get_meta(doc) will be called to get the default meta.

        If _id is not set the document is inserted.

        If _id is set, an existing document will be updated.
        If the _id is a string it will be automaticly converted to a mongo ObjectId.

        If the specified document does not exist it will raise an exception.

        If replace is True then the existing document will be replaced, otherwise only the specified keys are updated.

        """

        collection = self.default_collection

        #check and convert data
        if meta:
            meta.meta['meta'].check(self.context, doc)
            doc=meta.meta['meta'].to_internal(self.context, doc)
        else:
            self.get_meta(doc).meta['meta'].check(self.context, doc)
            doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)
            

        #add new
        if not '_id' in doc:
            self.db[collection].insert(doc, manipulate=True, safe=True, check_keys=True)

        #use existing document
        else:
            #remove _id from document and store it in _id
            _id = doc.pop('_id')

            if replace:
                result = self.db[collection].update({'_id': _id}, doc, multi=False, safe=True)
            else:
                result = self.db[collection].update({'_id': _id}, {'$set': doc}, multi=False, safe=True)

            if result['n'] == 0:
                raise NotFound("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

            #restore _id, so we return a complete doc again
            doc['_id'] = _id


        return(doc)


    def _get(self, _id=None, match={}, filter={}):
        '''get a document from the collection.
        _id: The id-string of the object to get (if this is specified , filter and match are ignored)
        filter: a dict containing keys and regular expression strings.
        match: a dict containing keys with value that should exactly match (this overrules filters with the same key)

        throws exeception if not found
        '''

        collection = self.default_collection

        regex_filters = {}

        if _id:
            doc = self.db[collection].find_one(bson.objectid.ObjectId(_id))

            if not doc:
                raise NotFound("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

        else:
            for key in filter:
                regex_filters[key] = re.compile(filter[key], re.IGNORECASE)

            for key in match:
                regex_filters[key] = match[key]

            doc = self.db[collection].find_one(regex_filters)


            if not doc:
                raise NotFound("Object not found in collection '{}'".format(collection))


        #convert to external data (e.g. resolve relations) and return document
        return self.get_meta(doc).meta['meta'].to_external(self.context, doc)


    def _get_all(self, spec=None, fields=None, skip=0, limit=0, sort={}):
        '''gets one or more users according to search options

        fields: subset fields to return (http://www.mongodb.org/display/DOCS/Advanced+Queries)
        spec: specify which documents to return (http://www.mongodb.org/display/DOCS/Advanced+Queries)
        skip: number of items to skip
        limit: number of maximum items to return
        sort: a dict containing keys and sort directions (-1 descending, +1 ascending)


        '''

        collection = self.default_collection

        #NOTE: we choose to expose the pymongo api here for spec and fields. 
        #is it safe? 
        #should we wrap our own database agnostic wrapper around it, 
        #so that somebody can choose to use a differt data base backend? 
        #perhaps... time will tell, maybe i will refactor this later.
        #or maybe the stuff thats most used (like $gt, $lt, $regex) is generic enough already to be ported to other
        #database backends.

        return(self.db[collection].find(spec=spec,
                            fields=fields,
                            skip=skip,
                            limit=limit,
                            sort=list(sort.items())))


    def _delete(self, _id):
        '''deletes _id from collection

        throws exeception if not found

        returns a document with only _id set to the deleted id
        '''

        collection = self.default_collection

        result = self.db[collection].remove(bson.objectid.ObjectId(_id), safe=True)
        if result['n'] == 0:
            raise NotFound("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

        return({ '_id': _id })



