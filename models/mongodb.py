import models.common
import fields
import pymongo
import bson.objectid
import re


class NotFoundError(Exception):
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

        if not isinstance(data, (str)):
            raise fields.FieldError("id should be a string")

        if str(bson.objectid.ObjectId(data)) != str(data):
            raise fields.FieldError("invalid id: {} != {}".format(data, str(bson.objectid.ObjectId(data))))

    def to_internal(self, context, data):
        """converts input data to an actual internal bson objectid"""
        if data==None:
            return(data)
        else:
            return(bson.objectid.ObjectId(data))

    def to_external(self, context, data):
        """converts bson objectid to string"""
        if data==None:
            return(data)
        else:
            return(str(data))




class Relation(fields.Base):
    '''A relation field that contains one or more id's that point objects in another model

    All ids will be checked to see if they exist in the other model

    Its important that the forgein model has a get_all calls that works in the standard fasion.
    (this function will be used internally and by guis to resolve and search for related data)

    NOTE: In the future there can be other database relation-implementations with the same name in a different module. The gui shouldnt note a difference theoretically.
    '''



    def __init__(self, model, meta=None, list=True, min=None, max=None, resolve=True , check_exists=True, reference_collection=None, reference_search=None, **kwargs):
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
            check_exists: checks if the specified item exist in the forgeign model.
            reference_collection, reference_search: indicates the collection-name and search-key of the field that is referencing the related model.
            this prevents deletion of the related object.

        """

        super(Relation, self).__init__(**kwargs)

        #store the reference in the specified model
        if reference_collection:
            model.references[reference_collection][reference_key]=True

        if (min != None):
            if (min < 0):
                raise FieldError("Min cant be smaller than 0")
            self.meta['min'] = min

        if (max != None):
            if (max < 0):
                raise FieldError("Max cant be smaller than 0")
            self.meta['max'] = max

        if not isinstance(list, bool):
            raise FieldError("list should be a bool")

        self.meta['list'] = list
        self.meta['check_exists'] = check_exists

        if meta==None:
            if resolve:
                self.meta['meta']=model.meta
        else:
            self.meta['meta']=meta

        if 'meta' in self.meta:
            if not isinstance(self.meta['meta'], fields.List):
                FieldError("related metadata should be a list")


        self.meta['resolve']=resolve
        self.meta['model']=model.__module__.replace("models.","") #TODO: use regex

        self.model=model


    def check(self, context, data):

        if not super(Relation, self).check(context, data):
            return


        if self.meta['list']:

            if not isinstance(data, list):
                raise fields.FieldError("this field should be a list")


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

            if len(mongo_ids)>0 and self.meta['check_exists']:
                #call foreign model to check if all id's exist
                foreign_object=self.model(context)
                result=foreign_object.get_all(
                        fields={ '_id': True },
                        match_in={
                            foreign_object.get_meta(context).meta['list_key']: mongo_ids
                            }
                        );

                #TODO: specify which id in case resolve is true?
                if len(result)!=len(data):
                    raise fields.FieldError("an item in the list doesnt exist")

            if ('min' in self.meta) and len(mongo_ids)<self.meta['min']:
                raise fields.FieldError("should have at least {} item(s).".format(self.meta['min']))

            if ('max' in self.meta) and len(mongo_ids)>self.meta['max']:
                raise fields.FieldError("should have at most {} item(s).".format(self.meta['max']))

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
                    raise fields.FieldError("should be related to exactly one item")
            else:
                #check if item exists in forgein model (and is accessible by current context):
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

    def to_external(self, context, data, resolve=False):
        """resolve a list of bson objectids by calling the external model to get the corresponding data

        (only when resolve is True) """

        if self.meta['resolve']==False and resolve==False:
            #only convert bson ids to strings
            if isinstance(data,list):
                ret=[]
                for _id in data:
                    if _id==None:
                        ret.append(None)
                    else:
                        ret.append(str(_id))
                return(ret)
            else:
                if data==None:
                    return(None)
                else:
                    return(str(data))

        if self.meta['list']:
            if not isinstance(data,list):
                return (data)

            foreign_object=self.model(context)
            result=foreign_object.get_all(match_in={
                    self.model.meta.meta['list_key']: data
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

    def to_human(self, context, data):
        return(self.to_external(context, data, resolve=True))



#metaclass that sets default_collection after class creation

class BaseMeta(type):
    def __init__(cls, name, bases, dct):

        cls.default_collection = cls.__module__

        super(BaseMeta, cls).__init__(name, bases, dct)

class Base(models.common.Base, metaclass=BaseMeta):
    """Base class for models that use mongodb.

    Automatically sets self.db to the correct data, by parameters that are stored in the context object.

    It uses context.session['db_name'] as database name and context.session['db_host'] as the host.

    self.db is also stored in the context so that multiple models can use the same database instance,
    instead of using seperate connections to the database.


    """


    def __init__(self, context=None):
        super(Base, self).__init__(context=context)
        self.reconnect()


    def reconnect(self, force=False):
        """(re)connect to database which is defined in context.session and set default collection

            normally only called from __init__ and when trying to login (Users.py)
        """

        if force or not hasattr(self.context, 'mongodb_connection'):
            self.context.mongodb_connection = pymongo.mongo_client.MongoClient(host=self.context.session['db_host'])

        self.db = self.context.mongodb_connection[self.context.session['db_name']]



    def _put(self, doc, replace=False):
        """Checks document with field and replaces, updates or inserts it into collection

        self.get_meta(doc) will be called to get the default meta.

        If _id is not set the document is inserted.

        If _id is set, an existing document will be updated.
        If the _id is a string it will be automaticly converted to a mongo ObjectId.

        If the specified document does not exist it will raise an exception.

        If replace is True then the existing document will be replaced, otherwise only the specified keys are updated.

        """

        collection = self.default_collection

        #check and convert data
        self.get_meta(doc).meta['meta'].check(self.context, doc)
        doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)


        try:
            #add new
            if not '_id' in doc:
                self.db[collection].insert(doc, manipulate=True, check_keys=True)

            #use existing document
            else:
                #remove _id from document and store it in _id
                _id = doc.pop('_id')

                if replace:
                    result = self.db[collection].update({'_id': _id}, doc, multi=False)
                else:
                    result = self.db[collection].update({'_id': _id}, {'$set': doc}, multi=False)

                if result['n'] == 0:
                    raise NotFoundError("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

                #restore _id, so we return a complete doc again
                doc['_id'] = _id
        except (pymongo.errors.DuplicateKeyError) as e:
                raise fields.FieldError("An object with this name already exists. ("+str(e)+")")

        return(self.get_meta(doc).meta['meta'].to_external(self.context, doc))


    def _get(self, _id=None, match={}, regex={}, fields=None):
        '''get a document from the collection.
        _id: The id-string of the object to get (if this is specified , filter and match are ignored)
        regex: a dict containing keys and regular expression strings.
        match: a dict containing keys with value that should exactly match (this overrules filters with the same key)

        throws exeception if not found
        '''

        collection = self.default_collection

        regex_filters = {}

        if _id:
            doc = self.db[collection].find_one(bson.objectid.ObjectId(_id),projection=fields)

            if not doc:
                raise NotFoundError("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

        else:
            for key in regex:
                regex_filters[key] = re.compile(regex[key], re.IGNORECASE)

            for key in match:
                regex_filters[key] = match[key]

            doc = self.db[collection].find_one(regex_filters,projection=fields)


            if not doc:
                raise NotFoundError("Object not found in collection '{}'".format(collection))


        #convert to external data (e.g. resolve relations) and return document
        return self.get_meta(doc).meta['meta'].to_external(self.context, doc)


    def _get_all(self, fields=None, skip=0, limit=0, sort=[], match=None, match_in=None, match_nin=None,regex=None, regex_or=None, gte=None, lte=None, spec_and=[], spec_or=[]):
        '''gets one or more users according to search options

        fields: subset fields to return (http://www.mongodb.org/display/DOCS/Advanced+Queries)
        skip: number of items to skip
        limit: number of maximum items to return
        sort: a list of key,direction pairs (-1 descending, +1 ascending)

        Filter options:

        Filters are all anded together. (the result of regex_or is also anded with the rest of the filters)

        match: dict with keys and values to exactly match
        match_in: dict with key and list of values. (match any record that matches any of the values in the list)
        match_nin: dict with key and list of values. (match any record that matches non of the values in the list)
        regex_or: dict with keys and values to case insensitive regex match, OR based
        regex: dict with keys and values to case insensitive regex match
        gte:    dict of keys that should be greater than or equal to value
        lte:    dict of keys that should be less than or equal to value

        spec_and, spec_or: lists with extra mongodb-style queries to add to the and/or lists. NOTE: these are not converted to internal format and therefore do not function with unconverted mongo id's


        '''

        meta=self.get_meta()
        spec_ors=list(spec_or)
        spec_ands=list(spec_and)


        #queries are too complex to do this i think:
        # #try to convert spec_and and spec_or to internal data format:
        # for this_or in spec_or:
        #     conv_or={}
        #     for (key,value) in this_or.items():
        #         if isinstance(value, dict):
        #             for (query, query_val) in value:
        #                 conv_or[key]={
        #                     query: self.meta.meta['meta'].meta['meta'][key].to_internal(self.context, query_val)
        #                 }
        #         else:
        #             conv_or[key]=self.meta.meta['meta'].meta['meta'][key].to_internal(self.context, value)
        #     spec_ors.append(conv_or)

        # for this_and in spec_and:
        #     conv_and={}
        #     for (key,value) in this_and.items():
        #         if isinstance(value, dict):
        #             for (query, query_val) in value:
        #                 conv_and[key]={
        #                     query: self.meta.meta['meta'].meta['meta'][key].to_internal(self.context, query_val)
        #                 }
        #         else:
        #             conv_and[key]=self.meta.meta['meta'].meta['meta'][key].to_internal(self.context, value)
        #     spec_ands.append(conv_and)


        if regex_or!=None:
            for (key,value) in regex_or.items():
                spec_ors.append({
                    key : re.compile(value, re.IGNORECASE)
                    })

        if gte!=None:
            for (key,value) in gte.items():
                spec_ands.append({
                        key: {
                            '$gte': value
                            }
                        })

        if lte!=None:
            for (key,value) in lte.items():
                spec_ands.append({
                        key: {
                           '$lte': value
                            }
                        })

        # if key_in!=None:
        #     for (key,value) in key_in.items():
        #         spec_ands.append({
        #                 key: {
        #                    '$in': value
        #                     }
        #                 })

        if regex!=None:
            for (key,value) in regex.items():
                spec_ands.append({
                    key: re.compile(value, re.IGNORECASE)
                    })

        if match!=None:
            for (key,value) in match.items():
                spec_ands.append({
                    key: meta.meta['meta'].meta['meta'][key].to_internal(self.context, value)
                    })


        if match_in!=None:
            for (key,values) in match_in.items():
                converted_values=[];

                #FIXME: to_internal conversion only works for toplevel keys, since we use dot-notation
                if meta.meta['meta'].meta['meta'][key].meta['type']=='List':
                    #if the type is list, let the list do the conversion.
                    #in this case the user probably wants to find documents that match ANY item from values and not ALL the items.
                    converted_values=meta.meta['meta'].meta['meta'][key].to_internal(self.context, values)
                else:
                    for value in values:
                        converted_values.append(meta.meta['meta'].meta['meta'][key].to_internal(self.context, value))

                spec_ands.append({
                    key: {
                        '$in': converted_values
                    }
                })

        if match_nin!=None:
            for (key,values) in match_nin.items():
                converted_values=[];

                #FIXME: to_internal conversion only works for toplevel keys, since we use dot-notation
                if meta.meta['meta'].meta['meta'][key].meta['type']=='List':
                    #if the type is list, let the list do the conversion.
                    #in this case the user probably wants to find documents that match NANY item from values and not NALL the items.
                    converted_values=meta.meta['meta'].meta['meta'][key].to_internal(self.context, values)
                else:
                    for value in values:
                        converted_values.append(meta.meta['meta'].meta['meta'][key].to_internal(self.context, value))

                spec_ands.append({
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
        #         spec_ands.append({
        #             list_key: {
        #                 '$in': ids
        #                 }
        #             })

        #     if id_nin!=None:
        #         ids=[]
        #         for id in id_nin:
        #             ids.append(meta.meta['meta'].meta['meta'][list_key].to_internal(self.context, id))
        #         spec_ands.append({
        #             list_key: {
        #                 '$nin': ids
        #                 }
        #             })


        #combine the ands and ors.
        #(note that the or-result is anded together with the other ands by mongodb)
        spec={}

        if spec_ands:
            spec['$and']=spec_ands

        if spec_ors:
            spec['$or']=spec_ors


        #always sort in natural order as last, in the same direction as the last sort-item.
        #this way we get more consistent results if the items are the same. (as happens with dates a lot)
        if not isinstance(sort, list):
            raise Exception("Sort should be a list with key,direction pairs.")


        if sort:
            last_direction=sort[len(sort)-1][1]
            sort.append(  ( "_id", last_direction ) )
        #no sort always shows items in 'natural' order, newest first
        else:
            sort.append(  ( "_id", -1 ) )

        cursor=self.db[self.default_collection].find(filter=spec,
                            projection=fields,
                            skip=skip,
                            limit=limit,
                            sort=sort)

        #TODO: optimize, make external-conversion optional? especially some way to make resolving optional. or is it up to the user to use field to only ask for relevant fields?
        return self.get_meta().to_external(self.context, list(cursor))



    def _delete(self, _id):
        '''deletes _id from collection

        throws exeception if not found

        returns a document with only _id set to the deleted id
        '''

        collection = self.default_collection

        result = self.db[collection].remove(bson.objectid.ObjectId(_id))
        if result['n'] == 0:
            raise NotFoundError("Object with _id '{}' not found in collection '{}'".format(str(_id), collection))

        return({ '_id': _id })



    def get_next_nr(self):
        '''gets next unique sequential number for this collection'''
        ret = self.db['counters'].find_and_modify(
                query={ '_id': self.default_collection },
                update={ '$inc': { 'seq': 1 } },
                upsert=True,
                new=True
        )

        return(int(ret['seq']))
