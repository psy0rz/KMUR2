import models.common
import fields
import pymongo
import bson.objectid
import re


class NotFound(Exception):
    pass

class NoAccess(Exception):
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

        if str(bson.objectid.ObjectId(data)) != str(data):
            raise fields.FieldException("invalid id: {} != {}".format(data, str(bson.objectid.ObjectId(data))))

    def to_internal(self, context, data):
        """converts input data to an actual internal bson objectid"""
        return(bson.objectid.ObjectId(data))


class Relation(fields.Base):
    '''A relation field that contains one or more id's that point objects in another model

    All ids will be checked to see if they exist in the other model

    Its important that the forgein model has a get_all calls that works in the standard fasion. 
    (this function will be used internally and by guis to resolve and search for related data)

    NOTE: In the future there can be other database relation-implementations with the same name in a different module. The gui shouldnt note a difference theoretically. 
    '''


    def __init__(self, model, meta=None, list=True, min=None, max=None, resolve=True , **kwargs):
        """
            model: specifies the related model (as a python object)
            meta: Metadata of related data. If not specified then model.meta is used. you can specify this in case you want dynamic metadata vs static.
            list: false: Relation to a single foreign object (N:1 relation). Otherwise its a list of relations, hence a N:N relation
            min: Minimum number of relations (default 0)
            max: Maximum number of relations. (only used when list=true)
            resolve: resolve ids to foreign data and back. (when calling _get and _put) 
                set this to false if the amount of data is getting too much: in this case the gui should do the resolving itself. 
                (the stuff in field.js will take care of extra rpc-calls to the foreign model)
                this is a tradeoff the developer has to make, depending on the application.

        """

        super(Relation, self).__init__(**kwargs)


        if (min != None):
            if (min < 0):
                raise FieldException("Min cant be smaller than 0")
            self.meta['min'] = min

        if (max != None):
            if (max < 0):
                raise FieldException("Max cant be smaller than 0")
            self.meta['max'] = max

        if not isinstance(list, bool):
            raise FieldException("list should be a bool")

        self.meta['list'] = list

        if meta==None:
            if resolve:
                self.meta['meta']=model.meta
        else:
            self.meta['meta']=meta


        if 'meta' in self.meta:
            if not isinstance(self.meta['meta'], fields.List):
                FieldException("related metadata should be a list")


        self.meta['resolve']=resolve
        self.meta['model']=model.__module__.replace("models.","") #TODO: use regex

        self.model=model


    def check(self, context, data):

        if not super(Relation, self).check(context, data):
            return


        if self.meta['list']:

            if not isinstance(data, list):
                raise fields.FieldException("this field should be a list")


            #check mongo ID's validity
            mongo_ids=[]

            if len(data)>0:
                #try to handle resolved and unresolved data inteligently. 
                #we always just want to endup with a list of mongo-id's
                if isinstance(data[0], dict):
                    #data is a list of foreign documents
                    list_key=self.meta['meta'].meta['list_key']

                    for doc in data:
                        mongo_ids.append(doc[list_key])

                else:
                    mongo_ids=data

            #call foreign model to check if all id's exist
            foreign_object=self.model(context)
            result=foreign_object.get_all(
                    fields='_id',
                    match_in={
                        foreign_object.meta.meta['list_key']: mongo_ids
                        }
                    );

            #TODO: specify which id in case resolve is true? (altough this error should never happen)
            if len(result)!=len(data):
                raise fields.FieldException("an item in the list doesnt exist")

            if ('min' in self.meta) and len(result)<self.meta['min']:
                raise fields.FieldException("should have at least {} item(s).".format(self.meta['min']))

            if ('max' in self.meta) and len(result)>self.meta['max']:
                raise fields.FieldException("should have at most {} item(s).".format(self.meta['max']))

        else:
            mongo_id=None
            if isinstance(data, dict):
                list_key=self.meta['meta'].meta['list_key']
                if list_key in data:
                    mongo_id=data[list_key]
            else:
                mongo_id=data

            #check if None is allowed:
            if mongo_id==None:
                if ('min' in self.meta) and self.meta['min']>0:
                    raise fields.FieldException("should be related to exactly one item")
            else:
                #check if item exists in forgein model:
                foreign_object=self.model(context)
                foreign_object.get(mongo_id)



    def to_internal(self, context, data):
        """convert object ids from input data to actual bson objectids

        there are 4 posibilities:
            1. data is a string and is interpreted as a single bson object id. (when list==false and also usefull when doing a get_all 'match' or 'match_in')
            2. data is a dict (resolved relation)
            3. data is a list of strings. (unresolved relation)
            4. data is a list of dicts. (resolved relation, in this case all the 'list_key's will be converted to a list of bson objectids)
        """


        if isinstance(data, list):
            if len(data)>0:
                if isinstance(data[0], dict):
                    #data is a list of foreign documents (e.g. dicts)
                    list_key=self.meta['meta'].meta['list_key']
                    mongo_ids=[]
        
                    for doc in data:
                        mongo_id=bson.objectid.ObjectId(doc[list_key])
                        mongo_ids.append(mongo_id)

                    return(mongo_ids)

                else:
                    #data is just a list of id's in string format:
                    mongo_ids=[]
                    for id in data:
                        mongo_id=bson.objectid.ObjectId(id)
                        mongo_ids.append(mongo_id)

                    return(mongo_ids)
            else:
                return ([])

        elif isinstance(data, dict):
            list_key=self.meta['meta'].meta['list_key']
            return(bson.objectid.ObjectId(data[list_key]))

        elif isinstance(data, str):
            return(bson.objectid.ObjectId(data))
        else:
            return(data)

    def to_external(self, context, data):
        """resolve a list of bson objectids by calling the external model to get the corresponding data

        (only when resolve is True) """

        if self.meta['resolve']==False:
            return(data)

        if self.meta['list']:
            if not isinstance(data,list):
                return (data)

            foreign_object=self.model(context)
            result=foreign_object.get_all(match_in={
                    self.meta['meta'].meta['list_key']: data
                })

            return(result)
        else:
            if data==None:
                return(None)
            
            foreign_object=self.model(context)
            try:
                return(foreign_object.get(data))
            except:
                #non existing or non allowed data will simply None
                return(None) 



class Base(models.common.Base):
    """Base class for models that use mongodb.

    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.session['db_name'] as database name and context.session['db_host'] as the host.

    self.db is also stored in the context so that multiple models can use the same database instance,
    instead of using seperate connections to the database.
    

    """

    def __init__(self, context=None):
        super(Base, self).__init__(context=context)

        if not hasattr(context, 'mongodb_connection'):
            context.mongodb_connection = pymongo.Connection(host=context.session['db_host'], safe=True)

        self.db = context.mongodb_connection[context.session['db_name']]

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
            #NOTE:is this ever used?
            meta.meta['meta'].check(self.context, doc)
            doc=meta.meta['meta'].to_internal(self.context, doc)
        else:
            self.get_meta(doc).meta['meta'].check(self.context, doc)
            doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)
            

        try:
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
        except (pymongo.errors.DuplicateKeyError) as e:
                raise fields.FieldException("An object with this name already exists. ("+str(e)+")")

        return(doc)


    def _get(self, _id=None, match={}, regex={}):
        '''get a document from the collection.
        _id: The id-string of the object to get (if this is specified , filter and match are ignored)
        regex: a dict containing keys and regular expression strings.
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
            for key in regex:
                regex_filters[key] = re.compile(regex[key], re.IGNORECASE)

            for key in match:
                regex_filters[key] = match[key]

            doc = self.db[collection].find_one(regex_filters)


            if not doc:
                raise NotFound("Object not found in collection '{}'".format(collection))


        #convert to external data (e.g. resolve relations) and return document
        return self.get_meta(doc).meta['meta'].to_external(self.context, doc)


    def _get_all(self, fields=None, skip=0, limit=0, sort={}, match=None, match_in=None, match_nin=None,regex=None, regex_or=None, gte=None, lte=None, spec_and=[], spec_or=[]):
        '''gets one or more users according to search options

        fields: subset fields to return (http://www.mongodb.org/display/DOCS/Advanced+Queries)
        skip: number of items to skip
        limit: number of maximum items to return
        sort: a dict containing keys and sort directions (-1 descending, +1 ascending)

        Filter options:

        Filters are all anded together. (the result of regex_or is also anded with the rest of the filters)

        match: dict with keys and values to exactly match
        match_in: dict with key and list of values. (match any record that matches any of the values in the list)
        match_nin: dict with key and list of values. (match any record that matches non of the values in the list)
        regex_or: dict with keys and values to case insensitive regex match, OR based
        regex: dict with keys and values to case insensitive regex match
        gte:    dict of keys that should be greater than or equal to value
        lte:    dict of keys that should be less than or equal to value 

        spec_and, spec_or: lists with extra mongodb-style queries to add to the and/or lists.


        '''

        meta=self.get_meta()
        spec_or=spec_or.copy()
        spec_and=spec_and.copy()


        if regex_or!=None:
            for (key,value) in regex_or.items():
                spec_or.append({
                    key : re.compile(value, re.IGNORECASE)
                    })

        if gte!=None:
            for (key,value) in gte.items():
                spec_and.append({
                        key: {
                            '$gte': value 
                            }
                        })

        if lte!=None:
            for (key,value) in lte.items():
                spec_and.append({
                        key: {
                           '$lte': value 
                            }
                        })

        # if key_in!=None:
        #     for (key,value) in key_in.items():
        #         spec_and.append({
        #                 key: {
        #                    '$in': value 
        #                     }
        #                 })

        if regex!=None:
            for (key,value) in regex.items():
                spec_and.append({
                    key: re.compile(value, re.IGNORECASE)
                    })

        if match!=None:
            for (key,value) in match.items():
                spec_and.append({
                    key: meta.meta['meta'].meta['meta'][key].to_internal(self.context, value)
                    })


        if match_in!=None:
            for (key,values) in match_in.items():
                converted_values=[];

                #FIXME: to_internal conversion only works for toplevel keys, since we use dot-notation
                for value in values:
                    converted_values.append(meta.meta['meta'].meta['meta'][key].to_internal(self.context, value))

                spec_and.append({
                    key: {
                        '$in': converted_values
                    }
                })

        if match_nin!=None:
            for (key,values) in match_nin.items():
                converted_values=[];

                #FIXME: to_internal conversion only works for toplevel keys, since we use dot-notation
                for value in values:
                    converted_values.append(meta.meta['meta'].meta['meta'][key].to_internal(self.context, value))

                spec_and.append({
                    key : {
                        '$nin': converted_values
                    }
                })


        # if id_in!=None or id_nin!=None:

        #     list_key=meta.meta['list_key']


        #     if id_in!=None:
        #         ids=[]
        #         for id in id_in:
        #             ids.append(meta.meta['meta'].meta['meta'][list_key].to_internal(self.context, id))
        #         spec_and.append({
        #             list_key: {
        #                 '$in': ids
        #                 }
        #             })

        #     if id_nin!=None:
        #         ids=[]
        #         for id in id_nin:
        #             ids.append(meta.meta['meta'].meta['meta'][list_key].to_internal(self.context, id))
        #         spec_and.append({
        #             list_key: {
        #                 '$nin': ids
        #                 }
        #             })


        #combine the ands and ors. 
        #(note that the or-result is anded together with the other ands by mongodb)
        spec={}

        if spec_and:
            spec['$and']=spec_and

        if spec_or:
            spec['$or']=spec_or

        cursor=self.db[self.default_collection].find(spec=spec,
                            fields=fields,
                            skip=skip,
                            limit=limit,
                            sort=list(sort.items()))

        #TODO: optimize, make external-conversion optional? especially some way to make resolving optional. or is it up to the user to use field to only ask for relevant fields?
        return self.get_meta().to_external(self.context, list(cursor))



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



