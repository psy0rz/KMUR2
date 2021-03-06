'''This module contains data-field definitions that are used in models.

'''
import json
import bson.objectid
import pymongo.cursor
import re


class FieldError(Exception):
    """Field exception. This is thrown when verifying if data is correct.

    The fields list indicates which field of an object failed.
    This is sometimes used in recursion, so it will contain a 'path' to the field involved. (in case of Hash and Array)
    """
    def __init__(self, message, field=None):

        super(FieldError, self).__init__(message)

        if field:
            self.fields = [field]
        else:
            self.fields = []




class JSONEncoder(json.JSONEncoder):
    """JSON encoder extention that can convert all convert an object to built in types.

    Add a _to_builtin function to an existing class that returns a builtin type. this way it can be converted to json.
    (look at mongodb.py  or fields.py for an example)

    """
    def default(self, o):
        if hasattr(o, "_to_builtin"):
            return(o._to_builtin())

        raise(Exception("Cannot encode this object to json. Please add a _to_builtin function to it."))


class Base(object):
    """Base class of all fields

    We should be able to convert a Field to a builtin-type, so we can convert it to JSON for example.
    All data that should be convertable to a builtin should be stored in self.meta.

    @param default: Default value for the data
    @param desc: Description of the field
    @param readonly: Field is readonly and can not be changed
    @param required: Set this to false to allow the field to be None

    """

    def __init__(self, default=None, desc=None, readonly=None, required=None):
        self.meta = {}

        self.meta['type'] = self.__class__.__name__

        if default != None:
            self.meta['default'] = default

        if desc != None:
            if not isinstance(desc, str):
                raise FieldError("desc should be a string")
            self.meta['desc'] = desc

        if readonly != None:
            if not isinstance(readonly, bool):
                raise FieldError("readonly should be a bool")

            self.meta['readonly'] = readonly

        if required != None:
            if not isinstance(required, bool):
                raise FieldError("required should be a bool")
            self.meta['required'] = required


    #for json encoding, convert the field-object meta-data to json encodable form.
    def _to_builtin(self):
        return(self.meta)


    def check(self, context, data):
        '''does basic checking.

        note that check is called before converting data to the internal format.

        returns false if there shouldn't be any more checks done by subclasses.
        (usually in case required is set to  False and the data is set to None)'''

        if 'readonly' in self.meta and self.meta['readonly']:
            raise FieldError("This field is readonly")

        # If a value is not required it can be None, and further checks by the subclass are skipped.
        # In all other cases the subclass will do the rest of the checking.
        if 'required' in self.meta and not self.meta['required'] and data == None:
            return False

        return True

    def to_internal(self, context, data):
        '''converts user data input to internal data formats

        used when strings need to be converted to mongodb-ids for example, or when related data needs to converted back.

        this is always called before putting data into the database.

        look at JSONEncoder above, how to convert internal data formats back to user data output.
        '''

        return(data)

    def to_external(self, context, data):
        '''used for data that needs special conversions to user data output.

        mostly usefull for things like relations. 

        so for stuff that just needs to be json-encodable you should look at the JSONEncoder above.'''

        return(data)

    def to_human(self, context, data):
        '''convert field to human readable 

        this is mostly used inside models to transform things like Select field to their descriptive texts'''
        return(data)


    def ensure_defaults(self, context, data):
        '''ensure that unset keys get the default value (if a default is specified)'''
        return(self.meta['default'])


class Nothing(Base):
    '''Special type that allows nothing.'''
    def __init__(self, **kwargs):
        super(Nothing, self).__init__(**kwargs)

    def check(self, context, data):
        raise FieldError("This field cant be set")


class Dict(Base):
    """Data that contains a dict with other field-objects in it

    Usually the root-metadata is a Dict, since this is most usefull in practice.

    Dicts and Lists may be nested without problems.
    """

    def __init__(self, meta=None, required_fields=None, **kwargs):
        super(Dict, self).__init__(**kwargs)

        if not isinstance(meta, dict):
            raise FieldError("Metadata should be a dict")

        for key, submeta in meta.items():
            if not isinstance(submeta, Base):
                raise FieldError("Metadata {} should be an instance of fields.Base".format(key), key)

        if required_fields != None:
            if not isinstance(required_fields, list):
                raise FieldError("required-parameter should be a list")

            missing = [key for key in required_fields if key not in meta]
            if missing:
                raise FieldError("Field '{}' is required, but is missing from metadata".format(missing[0]), missing[0])

            self.meta['required'] = required_fields

        self.meta['meta'] = meta

    def check(self, context, data):

        if not super(Dict, self).check(context, data):
            return

        if not isinstance(data, dict):
            raise FieldError("Data should be a dict")

        for key, value in data.items():

            if not key in self.meta['meta']:
                raise FieldError("'{}' is an unknown field-name".format(key), key)

            try:
                #recurse into sub data
                self.meta['meta'][key].check(context, value)
            except FieldError as e:
                #record the key that throwed the exception:
                e.fields.insert(0, key)
                raise

        #missing fields?
        if 'required' in self.meta:
            missing = [key for key in self.meta['required'] if key not in data]
            if missing:
                raise FieldError("Required field {} is missing".format(missing[0]), missing[0])

    def to_internal(self, context, data):
        ret={}
        for key,value in data.items():
            ret[key]=self.meta['meta'][key].to_internal(context, value)

        return(ret)

    def to_external(self, context, data):
        ret={}
        for key,value in data.items():
            if key in self.meta['meta']:
                ret[key]=self.meta['meta'][key].to_external(context, value)

        return(ret)

    def to_human(self, context, data):
        ret={}
        for key,value in data.items():
            if key in self.meta['meta']:
                ret[key]=self.meta['meta'][key].to_human(context, value)

        return(ret)

    def ensure_defaults(self, context, data):
        ret=dict(data)
        for key,sub_meta in self.meta['meta'].items():
                if not key in ret:
                    ret[key]=sub_meta.ensure_defaults(context, None)

        return(ret)


class List(Base):
    """Data that contains a list of other field-objects

    Usually a list contains a dict, since this is most usefull in practice (escpecially with our javascript gui framework)

    Dicts and Lists may be nested without problems.

    @param list_key: which field to use as key when referring to a specific dataitem in a list. 
    if None then normal zero-based array indexing will be used. 
    note that these list_keys are also used when throwing field errors and in the gui frontends to focus fields etc.

    """

    def __init__(self, meta=None, list_key=None, **kwargs):
        super(List, self).__init__(**kwargs)

        if not isinstance(meta, Base):
            raise FieldError("Metadata should be a an instance of fields.Base")

        if list_key != None:
            if not isinstance(list_key, str):
                raise FieldError("list_key should be a string")
            self.meta['list_key'] = list_key

        self.meta['meta'] = meta

    def check(self, context, data):

        if not super(List, self).check(context, data):
            return

        if not isinstance(data, list):
            raise FieldError("Data should be a list")

        for index, value in enumerate(data):
            try:
                #recurse into sub data
                self.meta['meta'].check(context, value)
            except FieldError as e:
                #record the key that throwed the exception:
                if ('list_key' in self.meta) and (self.meta['list_key'] in value):
                    #list_key based indexing
                    e.fields.insert(0, value[self.meta['list_key']])
                else:
                    #array based indexing
                    e.fields.insert(0, index)

                raise

    def to_internal(self, context, data):
        ret=[]
        for value in data:
            ret.append(self.meta['meta'].to_internal(context, value))

        return (ret)

    def to_external(self, context, data):
        ret=[]
        for value in data:
            ret.append(self.meta['meta'].to_external(context, value))

        return (ret)

    def to_human(self, context, data):
        ret=[]
        for value in data:
            ret.append(self.meta['meta'].to_human(context, value))

        return (ret)


    def ensure_defaults(self, context, data):
        ret=[]
        if data:
            for index, value in enumerate(data):
              ret.append(self.meta['meta'].ensure_defaults(context, value))

        return(ret)

# seems to make things more complicated..                
# class ListDict(object):
#     '''Easier way to create a List containing Dicts

#     This is a shorthand for List(Dict(...))

#     This is just to make the definition of metadata simpeller and more readable by humans.
#     '''

#     def __new__(cls, meta, list_key=None, **kwargs):
#         return(List(Dict(meta, **kwargs), list_key=list_key))


class String(Base):
    """A regular string, with optional min and max value"""

    def __init__(self, min=None, max=None, size=20, **kwargs):
        super(String, self).__init__(**kwargs)

        if min != None and max != None and max <= min:
            raise FieldError("Max cant be smaller than min")

        if (min != None):
            if (min < 0):
                raise FieldError("Min cant be smaller than 0")
            self.meta['min'] = min

        if (max != None):
            if (max < 0):
                raise FieldError("Max cant be smaller than 0")
            self.meta['max'] = max


        self.meta['size']=size

    def check(self, context, data):

        if not super(String, self).check(context, data):
            return

        if not isinstance(data, str):
            raise FieldError("This should be a string")

        if (('min' in self.meta) and (len(data) < self.meta['min'])):
            raise FieldError("Data should be at least {} characters long".format(self.meta['min']))

        if (('max' in self.meta) and (len(data) > self.meta['max'])):
            raise FieldError("Data should be at most {} characters long".format(self.meta['max']))

        return True

class Password(String):
    """Same as String, but with other GUI stuff"""

    def __init__(self, **kwargs):
        super(Password, self).__init__(**kwargs)


class Number(Base):
    """A number, with optional min and max value. 

    By default allows 0 decimals. (use decimals=.. to change)"""

    def __init__(self, min=None, max=None, size=10,decimals=0, **kwargs):
        super(Number, self).__init__(**kwargs)

        if min != None and max != None and max <= min:
            raise FieldError("Max cant be smaller than min")

        self.meta['decimals'] = decimals

        if (min != None):
            self.meta['min'] = min

        if (max != None):
            self.meta['max'] = max

        self.meta['size']=size

    def check(self, context, data):
        if not super(Number, self).check(context, data):
            return

        if not isinstance(data, (float, int)):
            raise FieldError("This should be a number")

        if (('min' in self.meta) and (data < self.meta['min'])):
            raise FieldError("Number should be at least {}".format(self.meta['min']))

        if (('max' in self.meta) and (data > self.meta['max'])):
            raise FieldError("Number should be at most {}".format(self.meta['max']))

        if round(data, self.meta['decimals']) != data:
            raise FieldError("Number should have no more than {} decimals".format(self.meta['decimals']))


class Timestamp(Base):
    """A unix timestamp"""

    #configurable 'null date' value, to allow favourable sorting
    def __init__(self, null_date=2**31-1, **kwargs):
        super(Timestamp, self).__init__(**kwargs)
        self.null_date=null_date

    def check(self, context, data):

        if not super(Timestamp, self).check(context, data):
            return

        if 'required' in self.meta and self.meta['required']:
            if data==None:
                raise FieldError("Please specify a date")

        if not isinstance(data, (int)) and not isinstance(data, (float)) and data!=None:
            raise FieldError("A timestamp should be an integer or Null")

        if (data!=None and data < 0):
            raise FieldError("Timestamp can not be negative")

    def to_internal(self, context, data):
        if data==None:
            data=self.null_date

        return(data)

    def to_external(self, context, data):
        if data==self.null_date:
           data=None

        return(data)

class Bool(Base):
    """Boolean, only real boolean types allowed"""

    def __init__(self, true_desc="Yes", false_desc="No", **kwargs):
        super(Bool, self).__init__(**kwargs)
        self.meta['true_desc']=true_desc
        self.meta['false_desc']=false_desc

    def check(self, context, data):

        if not super(Bool, self).check(context, data):
            return

        if not isinstance(data, (bool)):
            raise FieldError("This should be a boolean value (e.g. true or false)")


    def to_human(self, context, data):
        if data:
            return(self.meta['true_desc'])
        else:
            return(self.meta['false_desc'])


class Select(Base):
    '''Select list. User can select one item from choices'''

    def __init__(self, choices, **kwargs):

        super(Select, self).__init__(**kwargs)

        if not isinstance(choices, list):
            raise FieldError("choices should be a list")

        self.meta['choices'] = choices

    def check(self, context, data):

        if not super(Select, self).check(context, data):
            return

        ok=False
        for choice in self.meta['choices']:
            if choice[0]!=None and data==choice[0]:
                ok=True
                break

        if not ok:
            raise FieldError("This is an invalid choice")

    def to_human(self, context, data):
        for choice in self.meta['choices']:
            if choice[0]!=None and data==choice[0]:
                return(choice[1])
        return(None)


class MultiSelect(Base):
    '''Multi select list. User can select multiple choices from a list'''

    def __init__(self, choices, **kwargs):

        super(MultiSelect, self).__init__(**kwargs)

        if not isinstance(choices, dict):
            raise FieldError("choices should be a dict")

        self.meta['choices'] = choices

    def check(self, context, data):

        if not super(MultiSelect, self).check(context, data):
            return

        if not isinstance(data, list):
            raise FieldError("choices should be a list")

        illegal = [i for i in data if i not in self.meta['choices']]
        if illegal:
            raise FieldError("These choice(s) are illegal: {}".format(','.join(illegal)))

        if len(set(data)) != len(data):
            raise FieldError("List contains duplicate choices")

    def to_human(self, context, data):
        ret=[]
        for i in data:
            ret.append(self.meta['choices'][i])

        return(ret)

class Anything(Base):
    """Allow anything.

    Doesnt do any checks so use with caution!"""

    def __init__(self, choices, **kwargs):

        super(Anything, self).__init__(**kwargs)

    def check(self, context, data):

        if not super(Anything, self).check(context, data):
            return





class Email(String):
    """Just like a string, but checks for valid email adresses"""

    def __init__(self, **kwargs):
        super(Email, self).__init__(**kwargs)

        self.meta['type']='String';

    def check(self, context, data):

        if not super(Email, self).check(context, data):
            return

        #NOTE: correct checking is hard, see http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address
        if re.match("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", data)==None:
            raise FieldError("Invalid email address")

        return True


class Phone(String):
    """Just like a string, but checks for valid phone numbers"""

    def __init__(self, **kwargs):
        super(Phone, self).__init__(**kwargs)

        self.meta['type']='String';

    def check(self, context, data):

        if not super(Phone, self).check(context, data):
            return

        #For now we do a very crude check
        if re.search("[^0-9+() ]", data)!=None:
            raise FieldError("Invalid phone number")

        return True



class File(Base):
    """A file-object

    This is kind of a special case: Files are uploaded out-of-band as multipart/form-data. 
    The models should handle the bottle.FileUpload objects they receive via RPC calls.
    After they can store the filename in the database as simple string. 

    Downloading of files can be handeled by the webserver or by using a GET request and letting the model return a bottle.HTTPResponse.


    """

    def __init__(self,**kwargs):
        super(File, self).__init__(**kwargs)

    def check(self, context, data):

        if not super(File, self).check(context, data):
            return

        if not isinstance(data, str):
            raise FieldError("This should be a string (this is probably a program error)")

        return True

class Image(Base):
    """An Image

    This is just the URL to the image. 

    """

    def __init__(self,**kwargs):
        super(Image, self).__init__(**kwargs)

    def check(self, context, data):

        if not isinstance(data, str):
            raise FieldError("This should be a string")

        return True



