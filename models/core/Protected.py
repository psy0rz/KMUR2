from models.common import *
import fields
import models.mongodb
from models import mongodb

def contains(a,b):
    """returns true if 'a contains b', where a and b might b lists or strings"""

    if isinstance(a,list):
        if isinstance(b,list):
            return (len([i for i in a if i in b]) != 0)
        else:
            return(b in a)
    else:
        if isinstance(b,list):
            return (a in b)
        else:
            return(a==b)


class Protected(models.mongodb.Base):
    """objects that are protected by comparing certain relations fields from self.context, when getting and putting

        check do do when reading data (get and get_all)
        read: 
        {
            'fieldname': {
                'context_field':                context field name
                'set_on_create': True           when creating new documents, set the value of this field to that of the context (only used for writing)
                'check': True                   when set to true, it means the field is checked (read or write)
            }
        }

        check to do when writing data (put and delete)
        write:
            (same as read)

    """



    def __init__(self, context=None):
        super(Protected, self).__init__(context=context)


    def _put(self, doc, meta=None, replace=False):
        """Do a protected _put

            When _id is specified, it calls the parent ._get function and does the checks.

            When the checks are ok it does set the fields the specified fields and does the actual _put on the parent.


        """

        #existing document, read it and check permissions
        if '_id' in doc:
            check_doc=super(Protected, self)._get(_id=doc['_id'])
            access=False
            for meta_key, check in self.write.items():
                if check['check']:
                    if meta_key in check_doc and (contains(check_doc[meta_key], getattr(self.context, check['context_field']))):
                        access=True
                        break

            if (not access):
                raise NoAccess("You're not allowed to modify this document")

        else:
            #new document, store set permissions
            for meta_key, check in self.write.items():
                if check['set_on_create']:
                    #make sure to use the correct datatype for the relation:
                    if self.meta.meta['meta'].meta['meta'][meta_key].meta['list']:
                        if isinstance(getattr(self.context, check['context_field']), list):
                            #both list:
                            doc[meta_key]=getattr(self.context, check['context_field'])
                        else:
                            #document field is list:
                            doc[meta_key]=[getattr(self.context, check['context_field'])]
                    else:
                        if isinstance(getattr(self.context, check['context_field']), list):
                            #document field is string, but context is list:
                            #kind of a hack? we use the first item of the list
                            doc[meta_key]=getattr(self.context, check['context_field'])[0]
                        else:
                            #both are string:
                            doc[meta_key]=getattr(self.context, check['context_field'])

        return(super(Protected, self)._put(doc,meta,replace))


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


    def _get_all(self, fields=None, skip=0, limit=0, sort={}, match=None, match_in=None, match_nin=None,regex=None, regex_or=None, gte=None, lte=None):
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


        '''

        meta=self.get_meta()

        spec_and=[]
        spec_or=[]

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



