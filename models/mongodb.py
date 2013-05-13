import models.common
import fields
import pymongo
import bson.objectid
import re


class NotFound(Exception):
    pass


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


class FieldRelation(fields.Base):
    '''A relation field that contains one or more id's that point objects in another model

    All ids will be checked to see if they exist in the other model
    '''


    def __init__(self, model, **kwargs):
        """model: the forgein model that is related to. this will be used for checking if the id's exist"""


        if not issubclass(model, MongoDB):
            raise fields.FieldException("model should be a subclass of MongoDB")

        self.model=model

        super(FieldRelation, self).__init__(**kwargs)


    def check(self, context, data):

        if not super(FieldId, self).check(context, data):
            return

        if not isinstance(data, list):
            raise fields.FieldException("this field should be a list of ids")

        for id in data:
            if str(bson.objectid.ObjectId(id)) != id:
                raise fields.FieldException("the list contains an invalid id")

        #query the other model to see if all the id's are valid
        foreign_object=self.model(context)
        result=foreign_object._get_all(fields='_id', spec={
                '_id': {
                        '$in': data
                    }
                })

        if len(result)!=len(data):
            raise fields.FieldException("a item in the list doesnt exist")


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

        if meta:
            meta.meta['meta'].check(self.context, doc)
        else:
            self.get_meta(doc).meta['meta'].check(self.context, doc)

        #add new
        if not '_id' in doc:
            self.db[collection].insert(doc, manipulate=True, safe=True, check_keys=True)

        #use existing document
        else:
            #remove _id from document and store it in _id
            _id = bson.objectid.ObjectId(doc.pop('_id'))

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

        return doc


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



