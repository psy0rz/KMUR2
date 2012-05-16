class TypeException(Exception):
    """Type exception. This is thrown when verifying if data is correct. 
    
    The fields array indicates which field of an object failed.
    """
    def __init__(self, message, field=None):

        super().__init__(self, message)

        self.fields=[]
        
        if field!=None:
            self.fields.append(field)
            
class Type:
    
    pass


class TypeString(Type):
    """A regular string, with optional min and max value"""
    
    def __init__(self, min=0, max=None):
        if max!=None and max<=min:
            raise Exception("Max cant be smaller than min")

        self.min=min
        self.max=max
        self.type="string"
        

    def check(self,data):
        if not isinstance(groups,str):
            raise TypeException("This should be a string")



        Possible types:
         "string"/"password": The field is a string.
           max: If specified, check max length
           min: If specified, check min length
         "integer": A whole integer number
           max: If specified, check max value
           min: If specified, check min value
         "float": A floating point number
           max: If specified, check max value
           min: If specified, check min value
         "timestamp": A unix timestamp
         "bool": Boolean field, can only be 0 or 1.
         "hash": Another hash array. All the fields will be checked recursively against specified metadata.
          meta: Metadata to check against. (same format as this metadata)
         "array": An subarray of items. All the fields within the items will be checked recursively against specified metadata.
          meta: Metadata to check against. (same format as this metadata)
         "select": A select list that allows user to select one option.
          choices: A hasharray with the allowed options. option=>description.
         "multiselect": A select list that allows user to select multiple options.
          choices: A hasharray with the allowed options. option=>description.
         "id": A mongoDB identifier.
         "*": Allow anything and dont check it. dont forget to check it yourself!
