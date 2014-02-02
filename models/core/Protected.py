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


class NoAccessError(Exception):
    pass


class Protected(models.mongodb.Base):
    """objects that are protected by comparing certain relations fields from self.context, when getting and putting

        check do do when reading data (get and get_all)
        read: 
        {
            'fieldname': {
                'context_field':                context field name
                'check': True                   when set to true, it means the field is checked (read or write)
            }
        }

        check to do when writing data (put and delete)
        write:
            (same as read)


        write_roles: []                         roles that have full write access
        read_roles:  []                         roles that have full read access

    """

    read_roles=[]
    write_roles=[]
    read={}
    write={}

    def __init__(self, context=None):
        super(Protected, self).__init__(context=context)


    def _put(self, doc, **kwargs):
        """Do a protected _put

            When _id is specified, it calls the parent ._get function and does the write-checks.

            When the checks are ok it does set the fields the specified fields and does the actual _put on the parent.


        """

        if not self.context.has_roles(self.write_roles):
            check_doc={}
            converted_doc=self.get_meta(doc).meta['meta'].to_internal(self.context, doc)

            #existing document, read it and check permissions
            if '_id' in converted_doc:
                check_doc=super(Protected, self)._get(_id=converted_doc['_id'])
                access=False
                for meta_key, check in self.write.items():
                    if check['check']:
                        if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
                            access=True
                            break

                if (not access):
                    raise NoAccessError("You're not allowed to modify this document")

                #make sure the user doesnt remove read-access to "users" he does not have access to himself:
                for meta_key, check in self.read.items():
                    if check['check']:
                        removed_ids=[]

                        for id in check_doc[meta_key]:
                            if id not in converted_doc[meta_key]:
                                removed_ids.append(id)

                        if len(removed_ids):
                            foreign_model=self.meta.meta['meta'].meta['meta'][meta_key].model
                            foreign_object=foreign_model(self.context)

                            result=foreign_object.get_all(
                                fields={ foreign_model.meta.meta['list_key']: True },
                                match_in={ foreign_model.meta.meta['list_key']: removed_ids }
                            )
                            print(removed_ids, result)
                            if (len(removed_ids)!=len(result)):
                                raise fields.FieldError("You dont have permission to deny unknown users read-access to this document", meta_key)

                #make sure the user doesnt remove write-access to "users" he does not have access to himself:
                for meta_key, check in self.write.items():
                    if check['check']:
                        removed_ids=[]
                        for id in check_doc[meta_key]:
                            if id not in converted_doc[meta_key]:
                                removed_ids.append(id)

                        if len(removed_ids):
                            foreign_model=self.meta.meta['meta'].meta['meta'][meta_key].model
                            foreign_object=foreign_model(self.context)

                            result=foreign_object.get_all(
                                fields={ foreign_model.meta.meta['list_key']: True },
                                match_in={ foreign_model.meta.meta['list_key']: removed_ids }
                            )
                            if (len(removed_ids)!=len(result)):
                                raise fields.FieldError("You dont have permission to deny unknown users write-access to this document", meta_key)
            

            #do a "test update" to check permissions:
            check_doc.update(converted_doc)
            # check_doc=self.get_meta(check_doc).meta['meta'].to_internal(self.context, check_doc)

            #make sure user still has read acccess after modifications
            access=False
            for meta_key, check in self.read.items():
                if check['check']:
                    if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
                        access=True
                        break                    
            if not access:
                raise NoAccessError("Permission problem: You can't deny yourself read access to this object")

            #make sure user still has write acccess after modifications
            access=False
            for meta_key, check in self.write.items():
                if check['check']:
                    if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
                        access=True
                        break
            if not access:
                raise NoAccessError("Permission problem: You can't deny yourself write access to this object")


        return(super(Protected, self)._put(doc=doc,**kwargs))


    def _get(self, *args, **kwargs):
        """do protected _get.

            calls parent _get to get the document and does the read-checks.
        """

        doc=super(Protected, self)._get(*args, **kwargs)

        if self.context.has_roles(self.read_roles):
            return(doc)

        access=False
        for meta_key, check in self.read.items():
            if check['check']:
                if meta_key in doc and (contains(doc[meta_key], self.context.session[check['context_field']])):
                    access=True
                    break

        if (not access):
            raise NoAccessError("You're not allowed to read this document")

        return(doc)


    def _get_all(self, *args, spec_and=[], **kwargs):
        """do protected _get_all

        makes sure that _get_all only returns documents that the user in the context is allowed to access.

        it does this be adding a appropriate spec_and parameters to _get_all
        """

        if not self.context.has_roles(self.read_roles):

            spec_and=spec_and.copy()

            ors=[] #if any one of the check fields matches, then access is allowed
            for meta_key, check in self.read.items():
                if check['check']:
                    if isinstance(self.context.session[check['context_field']], list):
                        ors.append({ 
                            meta_key: { 
                                '$in': self.context.session[check['context_field']] 
                                }
                            })
                    else:
                        ors.append({ 
                            meta_key: self.context.session[check['context_field']] 
                            })

            if len(ors)>0:
                spec_and.append({ '$or' : ors})

        return(super(Protected, self)._get_all(*args, spec_and=spec_and, **kwargs))



    def _delete(self, _id):
        """deletes _id from collection, if writeaccess to the document is allowed"""

        if not self.context.has_roles(self.write_roles):
            check_doc=super(Protected, self)._get(_id)

            access=False
            for meta_key, check in self.write.items():
                if check['check']:
                    if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
                        access=True
                        break

            if (not access):
                raise NoAccessError("You're not allowed to modify this document")

        return(super(Protected, self)._delete(_id))



