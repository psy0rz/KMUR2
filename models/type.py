class TypeException(Exception):
    """Type exception. This is thrown when verifying if data is correct. 
    
    The fields list indicates which field of an object failed.
    This recursive, so its will contain a 'path' to the field involved. (in case of Hash and Array) 
    """
    def __init__(self, message, field=None):

        super(TypeException,self).__init__(message)

        self.fields=[]
        
        if field!=None:
            self.fields.append(field)
            

class Base:
    """Base class of all types
    
    We should be able to convert a Type to a builtin-type, so we can convert it to JSON for example.
    All data that should be convertable to a builtin should be stored in self.meta.
    """
    
    def __init__(self):
        """Subclass should check specified parameters and initalize self.meta."""
        raise TypeException("Not implemented")

    def check(self, data):
        """Subclass should verify if specified data conforms with metadata thats defined in self.meta."""
        raise TypeException("Not implemented")
    

class Dict(Base):
    """Data that contains a dict with other type-objects in it (type-string is 'hash')"""

    def __init__(self, meta=None):
        if not isinstance(meta, dict): 
            raise TypeException("Metadata should be a dict")
        
        for key, submeta in meta.iteritems():
            if not isinstance(submeta, Base):
                raise TypeException("Metadata {} should be an instance of Base".format(key), key)

        self.meta={
                   'type': 'hash',
                   'meta': meta
                   }        

    def check(self,data):
        
        if not isinstance(data, dict): 
            raise TypeException("Data should be a dict")
        
        for key, value in data.iteritems():

            if not key in self.meta['meta']:
                raise TypeException("Key {} not found in metadata".format(key), key)
            
            try:
                #recurse into sub data
                self.meta['meta'][key].check(value)
            except TypeException as e:
                #record the key that throwed the exception:
                e.fields.insert(0,key)
                raise

class List(Base):
    """Data that contains a list of other type-objects (type-string is 'array')"""

    def __init__(self, meta=None):
        if not isinstance(meta, Base): 
            raise TypeException("Metadata should be a an instance of Base")
        
        self.meta={
                   'type': 'array',
                   'meta': meta
                   }        

    def check(self,data):
        
        if not isinstance(data, list): 
            raise TypeException("Data should be a list")
        
        for index, value in enumerate(data):
            try:
                #recurse into sub data
                self.meta['meta'].check(value)
            except TypeException as e:
                #record the key that throwed the exception:
                e.fields.insert(0,index)
                raise

            
class String(Base):
    """A regular string, with optional min and max value"""
    
    def __init__(self, min=None, max=None):
        if min!=None and max!=None and max<=min:
            raise TypeException("Max cant be smaller than min")
        
        self.meta={
                   'type':'string'
        }
        
        if (min!=None):
            if (min<0):
                raise TypeException("Min cant be smaller than 0")
            self.meta['min']=min

        if (max!=None):
            if (max<0):
                raise TypeException("Max cant be smaller than 0")
            self.meta['max']=max
        
        
        
        

    def check(self,data):
        if not isinstance(data, str):
            raise TypeException("This should be a string")
        
        if (('min' in self.meta) and (len(data)<self.meta['min'])):
            raise TypeException("Data should be at least {} characters long".format(self.meta['min']))

        if (('max' in self.meta) and (len(data)>self.meta['max'])):
            raise TypeException("Data should be at most {} characters long".format(self.meta['max']))
            
class Number(Base):
    """A number, with optional min and max value"""
    
    def __init__(self, min=None, max=None, decimals=0):
        if min!=None and max!=None and max<=min:
            raise TypeException("Max cant be smaller than min")
        
        self.meta={
                   'type':'number',
                   'decimals':decimals

        }
        
        if (min!=None):
            self.meta['min']=min

        if (max!=None):
            self.meta['max']=max
        

    def check(self,data):
        if not isinstance(data, (float,int)):
            raise TypeException("This should be a number")
        
        if (('min' in self.meta) and (data<self.meta['min'])):
            raise TypeException("Number should be at least {}".format(self.meta['min']))

        if (('max' in self.meta) and (data>self.meta['max'])):
            raise TypeException("Number should be at most {}".format(self.meta['max']))

        if round(data, self.meta['decimals'])!=data:
            raise TypeException("Number should no more than {} decimals".format(self.meta['decimals']))



#        Possible types:
#         "string"/"password": The field is a string.
#           max: If specified, check max length
#           min: If specified, check min length
#         "integer": A whole integer number
#           max: If specified, check max value
#           min: If specified, check min value
#         "float": A floating point number
#           max: If specified, check max value
#           min: If specified, check min value
#         "timestamp": A unix timestamp
#         "bool": Boolean field, can only be 0 or 1.
#         "hash": Another hash array. All the fields will be checked recursively against specified metadata.
#          meta: Metadata to check against. (same format as this metadata)
#         "array": An subarray of items. All the fields within the items will be checked recursively against specified metadata.
#          meta: Metadata to check against. (same format as this metadata)
#         "select": A select list that allows user to select one option.
#          choices: A hasharray with the allowed options. option=>description.
#         "multiselect": A select list that allows user to select multiple options.
#          choices: A hasharray with the allowed options. option=>description.
#         "id": A mongoDB identifier.
#         "*": Allow anything and dont check it. dont forget to check it yourself!
