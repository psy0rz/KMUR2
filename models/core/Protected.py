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


    def _put(self, doc, **kwargs):
        """Do a protected _put

            When _id is specified, it calls the parent ._get function and does the write-checks.

            When the checks are ok it does set the fields the specified fields and does the actual _put on the parent.


        """

        #existing document, read it and check permissions
        if '_id' in doc:
            check_doc=super(Protected, self)._get(_id=doc['_id'])
            access=False
            for meta_key, check in self.write.items():
                if check['check']:
                    if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
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
                        if isinstance(self.context.session[check['context_field']], list):
                            #both list:
                            doc[meta_key]=self.context.session[check['context_field']]
                        else:
                            #document field is list:
                            doc[meta_key]=[self.context.session[check['context_field']]]
                    else:
                        if isinstance(self.context.session[check['context_field']], list):
                            #document field is string, but context is list:
                            #kind of a hack? we use the first item of the list
                            doc[meta_key]=self.context.session[check['context_field']][0]
                        else:
                            #both are string:
                            doc[meta_key]=self.context.session[check['context_field']]

        return(super(Protected, self)._put(doc=doc,**kwargs))


    def _get(self, *args, **kwargs):
        """do protected _get.

            calls parent _get to get the document and does the read-checks.
        """

        doc=super(Protected, self)._get(*args, **kwargs)

        access=False
        for meta_key, check in self.read.items():
            if check['check']:
                if meta_key in doc and (contains(doc[meta_key], self.context.session[check['context_field']])):
                    access=True
                    break

        if (not access):
            raise NoAccess("You're not allowed to read this document")

        return(doc)


    def _get_all(self, *args, spec_and=[], **kwargs):
        """do protected _get_all

        makes sure that _get_all only returns documents that the user in the context is allowed to access.

        it does this be adding a appropriate spec_and parameters to _get_all
        """
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

        check_doc=super(Protected, self)._get(_id)

        access=False
        for meta_key, check in self.write.items():
            if check['check']:
                if meta_key in check_doc and (contains(check_doc[meta_key], self.context.session[check['context_field']])):
                    access=True
                    break

        if (not access):
            raise NoAccess("You're not allowed to modify this document")

        return(super(Protected, self)._delete(_id))



