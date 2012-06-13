import json
import bson.objectid
import pymongo.cursor


class FieldException(Exception):
    """Field exception. This is thrown when verifying if data is correct.

    The fields list indicates which field of an object failed.
    This is sometimes used in recursion, so it will contain a 'path' to the field involved. (in case of Hash and Array)
    """
    def __init__(self, message, field=None):

        super(FieldException, self).__init__(message)

        if field:
            self.fields = [field]
        else:
            self.fields = []


class JSONEncoder(json.JSONEncoder):
    """JSON encoder that can also encode stuff thats inherited from field.Base

    Currently this stuff also can encode other things, like mongodb IDs and iterators
    """
    def default(self, o):

        #TODO: This mongodb stuff shouldnt be here but in models.mongodb.
        #Create some kind of hooking meganism that registers to this class or something.

        if isinstance(o, Base):
            return(o.meta)
        elif isinstance(o, bson.objectid.ObjectId):
            return(str(o))
        elif isinstance(o, pymongo.cursor.Cursor):
            #the reason we dont require model-functions to do this by themself is
            #because models can call other models and still use the iterators.
            return(list(o))
        else:
            return json.JSONEncoder.default(self, o)


class Base(object):
    """Base class of all fields

    We should be able to convert a Field to a builtin-type, so we can convert it to JSON for example.
    All data that should be convertable to a builtin should be stored in self.meta.

    """

    def __init__(self, default=None, desc=None, readonly=None):
        self.meta = {}

        self.meta['type'] = self.__class__.__name__

        if default != None:
            self.meta['default'] = default

        if desc != None:
            if not isinstance(desc, (unicode, str)):
                raise FieldException("desc should be a string")
            self.meta['desc'] = desc

        if readonly != None:
            if not isinstance(readonly, bool):
                raise FieldException("readonly should be a bool")

            self.meta['readonly'] = readonly

    def check(self, data):

        if 'readonly' in self.meta and self.meta['readonly']:
            raise FieldException("This field is readonly")


class Nothing(Base):
    '''Special type that allows nothing.'''
    def __init__(self, **kwargs):
        super(Nothing, self).__init__(**kwargs)

    def check(self, data):
        raise FieldException("This field cant be set")


class Dict(Base):
    """Data that contains a dict with other field-objects in it (type-string is 'hash')"""

    def __init__(self, meta=None, required=None, **kwargs):

        super(Dict, self).__init__(**kwargs)

        if not isinstance(meta, dict):
            raise FieldException("Metadata should be a dict")

        for key, submeta in meta.iteritems():
            if not isinstance(submeta, Base):
                raise FieldException("Metadata {} should be an instance of fields.Base".format(key), key)

        if required != None:
            if not isinstance(required, list):
                raise FieldException("required-parameter should be a list")

            missing = [key for key in required if key not in meta]
            if missing:
                raise FieldException("Field '{}' is defined as required, but is missing from metadata".format(missing[0]), missing[0])

            self.meta['required'] = required

        self.meta['meta'] = meta

    def check(self, data):

        super(Dict, self).check(data)

        if not isinstance(data, dict):
            raise FieldException("Data should be a dict")

        for key, value in data.iteritems():

            if not key in self.meta['meta']:
                raise FieldException("'{}' is an unknown field-name".format(key), key)

            try:
                #recurse into sub data
                self.meta['meta'][key].check(value)
            except FieldException as e:
                #record the key that throwed the exception:
                e.fields.insert(0, key)
                raise

        #missing fields?
        if 'required' in self.meta:
            missing = [key for key in self.meta['required'] if key not in data]
            if missing:
                raise FieldException("Required field {} is missing".format(missing[0]), missing[0])


class List(Base):
    """Data that contains a list of other field-objects (type-string is 'array')"""

    def __init__(self, meta=None, **kwargs):
        super(List, self).__init__(**kwargs)

        if not isinstance(meta, Base):
            raise FieldException("Metadata should be a an instance of fields.Base")

        self.meta['meta'] = meta

    def check(self, data):

        super(List, self).check(data)

        if not isinstance(data, list):
            raise FieldException("Data should be a list")

        for index, value in enumerate(data):
            try:
                #recurse into sub data
                self.meta['meta'].check(value)
            except FieldException as e:
                #record the key that throwed the exception:
                e.fields.insert(0, index)
                raise


class String(Base):
    """A regular string, with optional min and max value"""

    def __init__(self, min=None, max=None, **kwargs):
        super(String, self).__init__(**kwargs)

        if min != None and max != None and max <= min:
            raise FieldException("Max cant be smaller than min")

        if (min != None):
            if (min < 0):
                raise FieldException("Min cant be smaller than 0")
            self.meta['min'] = min

        if (max != None):
            if (max < 0):
                raise FieldException("Max cant be smaller than 0")
            self.meta['max'] = max

    def check(self, data):

        super(String, self).check(data)

        if not isinstance(data, (str, unicode)):
            raise FieldException("This should be a string")

        if (('min' in self.meta) and (len(data) < self.meta['min'])):
            raise FieldException("Data should be at least {} characters long".format(self.meta['min']))

        if (('max' in self.meta) and (len(data) > self.meta['max'])):
            raise FieldException("Data should be at most {} characters long".format(self.meta['max']))


class Password(String):
    """Same as String, but with other GUI stuff"""

    def __init__(self, **kwargs):
        super(Password, self).__init__(**kwargs)


class Number(Base):
    """A number, with optional min and max value"""

    def __init__(self, min=None, max=None, decimals=0, **kwargs):
        super(Number, self).__init__(**kwargs)

        if min != None and max != None and max <= min:
            raise FieldException("Max cant be smaller than min")

        self.meta['decimals'] = decimals

        if (min != None):
            self.meta['min'] = min

        if (max != None):
            self.meta['max'] = max

    def check(self, data):
        super(Number, self).check(data)

        if not isinstance(data, (float, int)):
            raise FieldException("This should be a number")

        if (('min' in self.meta) and (data < self.meta['min'])):
            raise FieldException("Number should be at least {}".format(self.meta['min']))

        if (('max' in self.meta) and (data > self.meta['max'])):
            raise FieldException("Number should be at most {}".format(self.meta['max']))

        if round(data, self.meta['decimals']) != data:
            raise FieldException("Number should no more than {} decimals".format(self.meta['decimals']))


class Timestamp(Base):
    """A unix timestamp"""

    def __init__(self, **kwargs):
        super(Timestamp, self).__init__(**kwargs)

    def check(self, data):

        super(Timestamp, self).check(data)

        if not isinstance(data, (int)):
            raise FieldException("A timestamp should be an integer")

        if (data < 0):
            raise FieldException("Timestamp can not be negative")


class Bool(Base):
    """Boolean, only real boolean types allowed"""

    def __init__(self, **kwargs):
        super(Bool, self).__init__(**kwargs)

    def check(self, data):

        super(Bool, self).check(data)

        if not isinstance(data, (bool)):
            raise FieldException("This should be a boolean value (e.g. true or false)")


class Select(Base):
    '''Select list. User can select one item from choices'''

    def __init__(self, choices, **kwargs):

        super(Select, self).__init__(**kwargs)

        if not isinstance(choices, dict):
            raise FieldException("choices should be a dict")

        self.meta['choices'] = choices

    def check(self, data):

        super(Select, self).check(data)

        if not data in self.meta['choices']:
            raise FieldException("This is an invalid choice")


class MultiSelect(Base):
    '''Multi select list. User can select multiple choices from a list'''

    def __init__(self, choices, **kwargs):

        super(MultiSelect, self).__init__(**kwargs)

        if not isinstance(choices, dict):
            raise FieldException("choices should be a dict")

        self.meta['choices'] = choices

    def check(self, data):

        super(MultiSelect, self).check(data)

        if not isinstance(data, list):
            raise FieldException("choices should be a list")

        illegal = [i for i in data if i not in self.meta['choices']]
        if illegal:
            raise FieldException("These choice(s) are illegal: {}".format(','.join(illegal)))

        if len(set(data)) != len(data):
            raise FieldException("List contains duplicate choices")


class Anything(Base):
    """Allow anything.

    Doesnt do any checks so use with caution!"""

    def __init__(self, choices, **kwargs):

        super(Anything, self).__init__(**kwargs)

    def check(self, data):

        super(Anything, self).check(data)
