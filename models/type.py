import json


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


class JSONEncoder(json.JSONEncoder):
    """JSON encoder that can also encode stuff thats inherited from type.Base"""
    def default(self, o):
       if isinstance(o, Base):
           return(o.meta)
       else:
           return super().default(o)
            

class Base(object):
    """Base class of all types
    
    We should be able to convert a Type to a builtin-type, so we can convert it to JSON for example.
    All data that should be convertable to a builtin should be stored in self.meta.
    """
    
    def __init__(self, type=None, default=None, desc=None, readonly=None):
        self.meta={}
        
        if type!=None:
            if not isinstance(type,str):
                raise TypeException("type should be a string")
            self.meta['type']=type

        if default!=None:
            self.meta['default']=default

        if desc!=None:
            if not isinstance(desc,str):
                raise TypeException("desc should be a string")
            self.meta['desc']=desc

        if readonly!=None:
            if not isinstance(readonly,bool):
                raise TypeException("readonly should be a bool")
            
            self.meta['readonly']=readonly
            

    def check(self, data):
        
        if 'readonly' in self.meta and self.meta['readonly']:
            raise TypeException("This field is readonly")
    

class Dict(Base):
    """Data that contains a dict with other type-objects in it (type-string is 'hash')"""

    def __init__(self, meta=None, required=None, type='hash', **kwargs):
        
        super(Dict,self).__init__(**kwargs)

        if not isinstance(meta, dict): 
            raise TypeException("Metadata should be a dict")
        
        for key, submeta in meta.iteritems():
            if not isinstance(submeta, Base):
                raise TypeException("Metadata {} should be an instance of Base".format(key), key)
            
        if required!=None:
            if not isinstance(required, list): 
                raise TypeException("required-parameter should be a list")

            missing=[key for key in required if key not in meta]
            if missing:
                raise TypeException("key '{}' is defined as required, but is missing from metadata".format(missing[0]), missing[0])
            
            self.meta['required']=required


        self.meta['meta']=meta

    def check(self,data):

        super(Dict,self).check(data)
        
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
            
        #missing fields?
        if 'required' in self.meta:
            missing=[key for key in self.meta['required'] if key not in data]
            if missing:
                raise TypeException("Required key {} is missing".format(missing[0]), missing[0])
            


class List(Base):
    """Data that contains a list of other type-objects (type-string is 'array')"""

    def __init__(self, meta=None, type='array', **kwargs):
        super(List,self).__init__(**kwargs)

        if not isinstance(meta, Base): 
            raise TypeException("Metadata should be a an instance of Base")
        
        self.meta['meta']=meta

    def check(self,data):

        super(List,self).check(data)
        
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
    
    def __init__(self, min=None, max=None, type='string', **kwargs):
        super(String,self).__init__(**kwargs)

        if min!=None and max!=None and max<=min:
            raise TypeException("Max cant be smaller than min")
        
        if (min!=None):
            if (min<0):
                raise TypeException("Min cant be smaller than 0")
            self.meta['min']=min

        if (max!=None):
            if (max<0):
                raise TypeException("Max cant be smaller than 0")
            self.meta['max']=max
        

    def check(self,data):
        
        super(String,self).check(data)

        if not isinstance(data, str):
            raise TypeException("This should be a string")
        
        if (('min' in self.meta) and (len(data)<self.meta['min'])):
            raise TypeException("Data should be at least {} characters long".format(self.meta['min']))

        if (('max' in self.meta) and (len(data)>self.meta['max'])):
            raise TypeException("Data should be at most {} characters long".format(self.meta['max']))


class Password(String):
    """Same as String, but with other GUI stuff"""
    
    def __init__(self, type='password', **kwargs):
        super(Password, self).__init__(**kwargs)
            

class Number(Base):
    """A number, with optional min and max value"""
    
    def __init__(self, min=None, max=None, decimals=0,type='number', **kwargs):
        super(Number, self).__init__(**kwargs)

        if min!=None and max!=None and max<=min:
            raise TypeException("Max cant be smaller than min")
        
        self.meta['decimals']=decimals
      
        if (min!=None):
            self.meta['min']=min

        if (max!=None):
            self.meta['max']=max
        
    def check(self,data):
        super(Number,self).check(data)

        if not isinstance(data, (float,int)):
            raise TypeException("This should be a number")
        
        if (('min' in self.meta) and (data<self.meta['min'])):
            raise TypeException("Number should be at least {}".format(self.meta['min']))

        if (('max' in self.meta) and (data>self.meta['max'])):
            raise TypeException("Number should be at most {}".format(self.meta['max']))

        if round(data, self.meta['decimals'])!=data:
            raise TypeException("Number should no more than {} decimals".format(self.meta['decimals']))


class Timestamp(Base):
    """A unix timestamp"""    

    def __init__(self,type='timestamp', **kwargs):
        super(Timestamp, self).__init__(**kwargs)

    def check(self,data):
  
        super(Timestamp,self).check(data)

        if not isinstance(data, (int)):
            raise TypeException("A timestamp should be an integer")
        
        if (data<0):
            raise TypeException("Timestamp can not be negative")


class Bool(Base):
    
    def __init__(self,type='bool', **kwargs):
        super(Bool, self).__init__(**kwargs)

    def check(self,data):

        super(Bool,self).check(data)
        
        if not isinstance(data, (bool)):
            raise TypeException("This should be a boolean value (e.g. true or false)")
        

class Select(Base):
    
    def __init__(self,type='select', **kwargs):
        super(Select, self).__init__(**kwargs)

    def check(self,data):
        
        super(Select,self).check(data)

        if not isinstance(data, (bool)):
            raise TypeException("This should be a boolean value (e.g. true or false)")

    
#        Possible types:
#         "select": A select list that allows user to select one option.
#          choices: A hasharray with the allowed options. option=>description.
#         "multiselect": A select list that allows user to select multiple options.
#          choices: A hasharray with the allowed options. option=>description.
#         "id": A mongoDB identifier.
#         "*": Allow anything and dont check it. dont forget to check it yourself!
