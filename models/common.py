"""common stuff for all models"""
from lib2to3.fixer_util import is_list


class Acl():
    """access control decorator.
    
    Use this on functions to provide access control to certain groups.
    This is mandatory for functions you want to be able to call via rpc.
    """ 
    def __init__(self, groups="admin"):
        self.groups = groups
    
    def __call__(self, f):
        def wrapped_f(wrapped_instance, *args, **kwargs):
            wrapped_instance.context.needGroups(self.groups)
            return(f(wrapped_instance, *args, **kwargs))
    
        #we want to be able to verify if the outer wrapper is an acl_wrapper            
        wrapped_f.has_acl_decorator=1
        return wrapped_f
        

class Context:
    """Stores the context a model operates in.
    
    This contains things like a username or a list of groups a user belongs to.
    Its also used to keep track of a logged in user used by @Acl to do access checks.
    The content of the context is preserved between requests. (magically by the rpc-code via sessions and cookies)
    """
    
    def reset(self):
        '''Reset user and group to default value
        '''
        self.user='anonymous'
        self.groups=['everyone']
            
    def __init__(self):
        self.reset()

    def hasGroups(self, groups):
        '''Check if the user has any of the rights (one is enough)
        
            groups can be iterable or a string
        '''
        if isinstance(groups,str):
            return (groups in self.groups)
        else:
            return (len([group for group in groups if group in self.groups]) != 0)

    def needGroups(self, groups):
        '''raises exception if the user isnt member of any of the groups
        '''
        if not self.hasGroups(groups):
            raise Exception('You need to be member of any of these groups: {}'.format(groups))

class Base:
    """Base class for all models
    """
    def __init__(self, context=None):
        if not isinstance(context, Context):
            raise Exception("Please provide a Context object for the model")

        self.context=context
        



