"""Base classes and decorators for all models"""

import re

DB_PREFIX="tracer"

def call_rpc(context, module, cls, method, *args, **kwargs):
    """resolve and call rpc models from strings, also called from rpc.py

    (mostly used internally)
    """
    if re.search("[^a-zA-Z0-9_]", module):
        raise Exception("rpc: Illegal module name")

    if re.search("[^a-zA-Z0-9]", cls):
        raise Exception("rpc: Illegal class name")

    if re.search("[^a-zA-Z0-9_]", method):
        raise Exception("rpc: Illegal method name")

    if re.search("^_", method):
        raise Exception("rpc: Methodname may not begin with _")

    rpc_models = __import__('models.' + module + '.' + cls)
    rpc_module = getattr(rpc_models, module)
    rpc_package = getattr(rpc_module, cls)
    rpc_class = getattr(rpc_package, cls)
    rpc_class_instance = rpc_class(context)
    if not isinstance(rpc_class_instance, Base):
        raise Exception("rpc: Class is not a model")
    rpc_method = getattr(rpc_class_instance, method)
    if not hasattr(rpc_method, 'rpc'):
        raise Exception("rpc: This method is protected from outside access because it has no @RPC decorator")
    return(rpc_method(*args,**kwargs))


class RPC(object):
    """RPC decorator. This makes a function callable via the rpc server

    You can provide accesscontrol and caching parameters:

        roles: the user needs one of these roles to be able to call the function. can be a iterable or a string.
        caching: 
            "no": not cachable
            "yes": yes, can be cached for ever. usefull for things that never change.
            NOT IMLEMENTED YET: "until_change": can be cached until something "changes". a change happens when something non-cachable is called.
    """
    def __init__(self, roles="admin", caching="no"):
        self.roles = roles
        self.caching = caching

    def __call__(self, f):
        def wrapped_f(wrapped_instance, *args, **kwargs):
            wrapped_instance.context.need_roles(self.roles)
            return(f(wrapped_instance, *args, **kwargs))

        #make the RPC object accesible via the returned function object
        wrapped_f.rpc=self
        wrapped_f.__doc__ = f.__doc__
        return wrapped_f


class Context(object):
    """Stores the context a model operates in.

    This contains things like a name or a list of roles a user belongs to.
    Its also used to keep track of a logged in user used by @RPC to do access checks.
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
        self.session = {}
        self.reset_user()

    #this is called on every request.
    #(the first time the context is created, but also after restoring the context from a session)
    #usefull to reinstate things like logging
    def reinit(self, debug=False):
        import models.core.Logs
        self.log = models.core.Logs.Logs(self)
        self._events=[]

        if debug:
            self._debug = []
        else:
            self._debug = None

    def __getstate__(self):
        '''define the items that should be preserved in a session here'''
        return({
                'session': self.session,
                })

    def reset_user(self):
        '''reset user to logged out state'''
        self.session['name'] = 'anonymous'
        self.session['roles'] = ['everyone']
        self.session['user_id'] = None
        self.session['group_ids'] = None


        self.session['db_name'] = DB_PREFIX #changed when a user logged in, see Users.py
        self.session['db_host'] = "localhost"

        self.session['previous_session']=None

    def has_roles(self, roles):
        '''Check if the user has any of the rights (one is enough)

            roles can be iterable or a string
        '''
        if isinstance(roles, str):
            return (roles in self.session['roles'])
        else:
            return (len([role for role in roles if role in self.session['roles']]) != 0)

    def need_roles(self, roles):
        '''raises exception if the user isnt member of any of the roles
        '''
        if not self.has_roles(roles):
            txt='Access denied - You need to be member of any of these roles: {}'.format(roles)
            self.log("warning", txt, self.__class__.__name__);
            raise Exception(txt)


    def event(self, name, value):
        '''send an event to the client. 

        events are tupple of eventnames and values. the GUI can use this to take actions.

        usually events are named like 'model.module.classname.changed' or .deleted.
        '''

        if (name,value) not in self._events:
            self._events.append( (name,value) )

    def get_results(self):
        '''gets the "results" of what was done during the context.

        These include things like logging and debugging data'''

        ret = {}

        if hasattr(self, 'log') and len(self.log.last_logs)>0:
            ret['logs'] = self.log.last_logs

        if hasattr(self, '_debug') and self._debug != None:
            ret['debug'] = self._debug

        if hasattr(self, '_events') and len(self._events)>0:
            ret['events']=self._events

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

    def event(self, name, value):
        '''send a event, but prepends name with full model and class name'''

        self.context.event(self.__module__.replace("models.","")+"."+name, value)

    @RPC(roles=["everyone"], caching="yes")
    def get_meta(self, *args, **kwargs):
        """Return the metadata for this model

        Usually this is a mandatory function thats used by the views as well to get the metadata.

        Fields may also be dynamic and returns different fields for different parameters.
        Usually the relevant document will be passed, so you can for example overwrite this function in a subclass
        and use the _id field to find the document and change the metadata according to the state of the document.

        """
        return (self.meta)
