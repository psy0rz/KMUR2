"""Base classes and decorators for all models"""


def call_rpc(context, module, cls, method, *args, **kwargs):
    """resolve and call rpc models from strings, almost like rpc.py would do 

    (mostly used internally)
    """

    rpc_models = __import__('models.' + module + '.' + cls)
    rpc_module = getattr(rpc_models, module)
    rpc_package = getattr(rpc_module, cls)
    rpc_class = getattr(rpc_package, cls)
    rpc_class_instance = rpc_class(context)
    rpc_method = getattr(rpc_class_instance, method)
    return(rpc_method(*args,**kwargs))


class Acl(object):
    """access control decorator.

    Use this on functions to provide access control to certain roles.
    This is mandatory for functions you want to be able to call via rpc.

    roles can be a iterable or a string`
    """
    def __init__(self, roles="admin"):
        self.roles = roles

    def __call__(self, f):
        def wrapped_f(wrapped_instance, *args, **kwargs):
            wrapped_instance.context.need_roles(self.roles)
            return(f(wrapped_instance, *args, **kwargs))

        #we want to be able to verify if the outer wrapper is an acl_wrapper
        wrapped_f.has_acl_decorator = 1
        wrapped_f.__doc__ = f.__doc__
        return wrapped_f


class Context(object):
    """Stores the context a model operates in.

    This contains things like a name or a list of roles a user belongs to.
    Its also used to keep track of a logged in user used by @Acl to do access checks.
    The content of the context is preserved between requests. (magically by the rpc-code via sessions and cookies)

    Sessions that are not logged in have user 'anonymous' and role 'everyone'.

    Sessions that are logged in are always member of the roles 'everyone' and 'user'

    Manupulation of user and role is currently done by models.core.Users.

    Some stuff like name is preserved in a session, so it will be restored on the next request
    (things like the logged in user, look in __getstate__ for more info)

    """

    #first time initaisation of a new context.
    #this is not called when the context is restored from a session.
    def __init__(self, debug=False):
        self.reset_user()

    #this is called on every request.
    #(the first time the context is created, but also after restoring the context from a session)
    #usefull to reinstate things like logging
    def reinit(self, debug=False):
        import models.core.Logs
        self.log = models.core.Logs.Logs(self)

        if debug:
            self._debug = []
        else:
            self._debug = None

    def __getstate__(self):
        '''define the items that should be preserved in a session here'''
        return({
                'name': self.name,
                'roles': self.roles,
                'user_id': self.user_id,
                'db_name': self.db_name,
                'db_host': self.db_host
                })

    def reset_user(self):
        '''reset user to logged out state'''
        self.name = 'anonymous'
        self.roles = ['everyone']
        self.user_id = None

        #make user configurable. should be database independent?
        self.db_name = "kmurtest"
        self.db_host = "localhost"

    def has_roles(self, roles):
        '''Check if the user has any of the rights (one is enough)

            roles can be iterable or a string
        '''
        if isinstance(roles, str):
            return (roles in self.roles)
        else:
            return (len([role for role in roles if role in self.roles]) != 0)

    def need_roles(self, roles):
        '''raises exception if the user isnt member of any of the roles
        '''
        if not self.has_roles(roles):
            txt='Access denied - You need to be member of any of these roles: {}'.format(roles)
            self.log("warning", txt, self.__class__.__name__);
            raise Exception(txt)

    def get_results(self):
        '''gets the "results" of what was done during the context.

        These include things like logging and debugging data'''

        ret = {}

        if hasattr(self, 'log'):
            ret['logs'] = self.log.last_logs

        if hasattr(self, '_debug') and self._debug != None:
            ret['debug'] = self._debug

        return ret

    def debug(self, debug_object, level=1):
        '''call this to add data to the debug buffer

        use level to specify a different 'level' on the call stack to get the filename, linenumber etc from.

        offcourse you can also just specify a text as debug_object
        '''

        if self._debug == None:
            return

        import traceback
        tb = traceback.extract_stack(limit=level + 1)
        self._debug.append({
                                'object': debug_object,
                                  'file': tb[0][0],
                              'function': tb[0][2],
                                  'line': tb[0][1]
                            })


class Base(object):
    """Base class for all models
    """
    def __init__(self, context=None):
        if not isinstance(context, Context):
            raise Exception("Please provide a Context instance for the model")

        self.context = context

    def info(self, text):
        self.context.log("info", text, self.__class__.__name__)

    def warning(self, text):
        self.context.log("warning", text, self.__class__.__name__)

    def error(self, text):
        self.context.log("error", text, self.__class__.__name__)

    def debug(self, debug_object):
        self.context.debug(debug_object, level=2)

    @Acl(roles=["everyone"])
    def get_meta(self, *args, **kwargs):
        """Return the metadata for this model

        Usually this is a mandatory function thats used by the views as well to get the metadata.

        Fields may also be dynamic and returns different fields for different parameters.
        Usually the relevant document will be passed, so you can for example overwrite this function in a subclass
        and use the _id field to find the document and change the metadata according to the state of the document.

        """
        return (self.meta)
