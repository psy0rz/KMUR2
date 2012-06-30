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

    def check(self, data):

        if not super(FieldId, self).check(data):
            return

        if not isinstance(data, (str, unicode, bson.objectid.ObjectId)):
            raise fields.FieldException("id should be a string or bson.ObjectId")

        if str(bson.objectid.ObjectId(data)) != data:
            raise fields.FieldException("invalid id")


class MongoDB(models.common.Base):
    """Base class for models that use mongodb.

    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.db_name as database name and context.db_host as the host.

    self.db is also stored in the context so that multiple models can use the same database instance,
    instead of using seperate connections to the database.
    
    Use default_collection to specify a collection, otherwise self.__class__.__module__ is used.

    Usually its advised that a model operates only on its own collection(s). Expand the api of other models if you need
    data from their collection.
    """

    def __init__(self, context=None, default_collection=None):
        super(MongoDB, self).__init__(context=context)

        if not hasattr(context, 'mongodb_connection'):
            context.mongodb_connection = pymongo.Connection(host=context.db_host, safe=True)

        self.db = context.mongodb_connection[context.db_name]

        if not default_collection:
            self.default_collection = self.__class__.__module__
        else:
            self.default_collection = default_collection

    def _put(self, doc, collection=None, meta=None, replace=False):
        """Checks document with field and replaces, updates or inserts it into collection

        If collection is not set, the self.default_collection will be used.

        If meta is set, the check function of that object will be used.
        Otherwise self.get_meta(doc) will be called to get the default meta.

        If _id is not set the document is inserted.

        If _id is set, an existing document will be updated.
        If the _id is a string it will be automaticly converted to a mongo ObjectId.

        If the specified document does not exist it will raise an exception.

        If replace is True then the existing document will be replaced, otherwise only the specified keys are updated.

        """

        if not collection:
            collection = self.default_collection

        if meta:
            meta.check(doc)
        else:
            self.get_meta(doc).check(doc)

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

    def _get(self, _id=None, match={}, filter={}, collection=None):
        '''get a document from the collection.
        collection: name of the collection to perform the search on. If not set, the self.default_collection is used.
        _id: The id-string of the object to get (if this is specified , filter and match are ignored)
        filter: a dict containing keys and regular expression strings.
        match: a dict containing keys with value that should exactly match (this overrules filters with the same key)

        throws exeception if not found
        '''

        if not collection:
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

    def _get_all(self, collection=None, filter={}, match={}, skip=0, limit=0, sort={}):
        '''gets one or more users according to search options

        collection: name of the collection to perform the search on.  If collection is not set, the self.default_collection will be used.
        filter: a dict containing keys and regular expression strings.
        match: a dict containing keys with value that should exactly match (this overrules filters with the same key)
        skip: number of items to skip
        limit: number of maximum items to return
        sort: a dect containing keys and sort directions (-1 descending, +1 ascending)
        '''

        if not collection:
            collection = self.default_collection

        regex_filters = {}

        for key in filter:
            regex_filters[key] = re.compile(filter[key], re.IGNORECASE)

        for key in match:
            regex_filters[key] = match[key]

        return(self.db[collection].find(spec=regex_filters,
                           skip=skip,
                           limit=limit,
                           sort=sort.items()))

    def _delete(self, _id, collection=None):
        '''deletes _id from collection

        If collection is not set, the self.default_collection will be used.

        throws exeception if not found
        '''

        if not collection:
            collection = self.default_collection

        result = self.db[collection].remove(bson.objectid.ObjectId(_id), safe=True)
        if result['n'] == 0:
            raise NotFound("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))
