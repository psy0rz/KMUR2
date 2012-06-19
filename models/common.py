"""common stuff for all models"""


import traceback

last_debugs = []


def debug(data):

    last_debugs.append({
                        'fb': traceback.extract_stack(f=None, limit=3),
                        'data': data
                        })


class Acl(object):
    """access control decorator.

    Use this on functions to provide access control to certain groups.
    This is mandatory for functions you want to be able to call via rpc.

    groups can be a iterable or a string
    """
    def __init__(self, groups="admin"):
        self.groups = groups

    def __call__(self, f):
        def wrapped_f(wrapped_instance, *args, **kwargs):
            wrapped_instance.context.need_groups(self.groups)
            return(f(wrapped_instance, *args, **kwargs))

        #we want to be able to verify if the outer wrapper is an acl_wrapper
        wrapped_f.has_acl_decorator = 1
        wrapped_f.__doc__ = f.__doc__
        return wrapped_f


class Context(object):
    """Stores the context a model operates in.

    This contains things like a username or a list of groups a user belongs to.
    Its also used to keep track of a logged in user used by @Acl to do access checks.
    The content of the context is preserved between requests. (magically by the rpc-code via sessions and cookies)

    Sessions that are not logged in have user 'anonymous' and group 'everyone'.

    Sessions that are logged in are always member of the groups 'everyone' and 'user'

    Manupulation of user and group is currently done by models.core.Users.

    Some stuff like username is preserved in a session, so it will be restored on the next request
    (things like the logged in user, look in __getstate__ for more info)

    """

    #first time initaisation of a new context.
    #this is not called when the context is restored from a session.
    def __init__(self):
        self.reset_user()

    #this is called on every request.
    #(the first time the context is created, but also after restoring the context from a session)
    #usefull to reinstate things like logging
    def reinit(self):
        import models.core.Logs
        self.log = models.core.Logs.Logs(self)

    def __getstate__(self):
        '''define the items that should be preserved in a session here'''
        return({
                'username': self.username,
                'groups': self.groups,
                'user_id': self.user_id,
                'db_name': self.db_name,
                'db_host': self.db_host
                })


    def reset_user(self):
        '''reset user to logged out state'''
        self.username = 'anonymous'
        self.groups = ['everyone']
        self.user_id = None

        #make user configurable. should be database independent?
        self.db_name = "kmurtest"
        self.db_host = "localhost"

    def has_groups(self, groups):
        '''Check if the user has any of the rights (one is enough)

            groups can be iterable or a string
        '''
        if isinstance(groups, str):
            return (groups in self.groups)
        else:
            return (len([group for group in groups if group in self.groups]) != 0)

    def need_groups(self, groups):
        '''raises exception if the user isnt member of any of the groups
        '''
        if not self.has_groups(groups):
            raise Exception('Access denied - You need to be member of any of these groups: {}'.format(groups))


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

    @Acl(groups=["everyone"])
    def get_meta(self, doc=None):
        """Return the metadata for this model

        Usually this is a mandatory function thats used by the views as well to get the metadata.

        Fields may also be dynamic and returns different fields for different parameters.
        Usually the relevant document will be passed, so you can for example use the _id field to find the document and
        change the metadata according to the state of the document.

        """
        return (self.meta)
