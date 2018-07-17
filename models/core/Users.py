from models.common import *
import fields
import models.mongodb

import models.core.Protected
import models.core.Groups
import re

import settings

class Users(models.core.Protected.Protected):
    '''user management'''

    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(min=3, desc='Username'),
                'import_id': fields.String(desc='Import ID'),
                'password': fields.Password(min=4, desc='Password'),
                'active': fields.Bool(desc="Enabled", default=True),
                'roles': fields.MultiSelect(desc="Roles of the user",
                                             choices={
                                                      #make this configurable in a seperate group-module?
                                                      #All users, including anonymous, have role 'everyone'.
                                                      #All users, except anonymous, have role 'user'
                                                      "admin": "Administrator",
                                                      "ticket_write": "Create and change tickets/relations",
                                                      "finance_read": "Finance read",
                                                      "finance_admin": "Finance administrator",
                                                    }),



                'fullname': fields.String(desc='Full name'),
                'email': fields.Email(
                        desc="Primary mail address"),
                'group_ids': models.mongodb.Relation(
                    desc='Groups this user belongs to',
                    model=models.core.Groups.Groups,
                    resolve=False,
                    list=True)
            }),
            list_key='_id'
        )


    write={
        'group_ids': {
            'context_field': 'group_ids',
            'check': True
        },
    }

    read=write

    #admin can access all users, not just his own
    admin_read_roles=["admin"]
    admin_write_roles=admin_read_roles

    @RPC(roles="admin")
    def put(self, **doc):

        if not re.match("^[a-zA-Z0-9._-]*$", doc['name']):
            raise fields.FieldError("Invalid characters in user", "name")


        if 'password' in doc and doc['password']=="":
            del doc['password']

        if '_id' in doc:
          log_txt="Changed user {name}".format(**doc)
        else:
          log_txt="Created new user {name}".format(**doc)

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)

        return(ret)

    @RPC(roles="user")
    def get(self, _id=None, match=None):
        return(self._get(_id=_id, match=match, fields={
                'password': False
            }))

    @RPC(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted user {name}".format(**doc))

        return(ret)

    @RPC(roles="user")
    def get_all(self, **params):
        if not 'fields' in params:
            params['fields']={}

        #note that mongodb cant mix inclusion and exclusion fields:

        #inclusion mode:
        if len(params['fields'].values())>0 and list(params['fields'].values())[0]==True:
            if 'password' in params['fields']:
                del(params['fields']['password'])
        #exclusion mode:
        else:
            params['fields']['password']=False

        return(self._get_all(**params))



    @RPC(roles=["everyone"])
    def switch_user_pop(self):

        if not self.context.session['previous_session']:
            raise fields.FieldError("No previous session found")

        self.context.session=self.context.session['previous_session']
        self.info("Switched back to user {name}".format(**self.context.session))
        self.send_session()


    @RPC(roles=["admin"])
    def switch_user(self, _id):
        '''switch to a different user (only admins can do this offcourse). its possible to switch back by using switch_user_pop()'''

        user = self.get(_id)

        new_session=dict(self.context.session) #keep db and other info
        new_session['previous_session']=dict(self.context.session)
        new_session['name'] = user['name']
        new_session['roles'] = user['roles']
        new_session['user_id'] = user['_id']
        new_session['group_ids']= user['group_ids']

        #every user MUST to be member of everyone and user
        new_session['roles'].append('everyone')
        new_session['roles'].append('user')

        #atomic switch
        self.context.session=new_session

        self.info("Switched to user {name}".format(**self.context.session))
        self.send_session()




    @RPC(roles=["everyone"])
    def login(self, name, password, api_key=None):
        '''authenticate the with the specified name and password.

        if its ok, it doesnt throw an exception and returns nothing'''


        #very imporant, we're going to switch DB so we need to be sure the user is logged out
        self.context.reset_user()

        if name.find("@")==-1:
            raise fields.FieldError("Please specify a valid name", "name")


        #select correct DB
        (username, domain)=name.split("@")
        db_postfix=re.sub("[^a-z0-9]","_",domain.lower())
        db_name=DB_PREFIX+db_postfix

        if db_name not in self.context.mongodb_connection.database_names():
            raise fields.FieldError("Domain not found", "name")


        self.context.session['db_name']=db_name
        self.context.session['domain']=domain
        self.reconnect(force=True)

        try:
            if api_key:
                if api_key!=settings.api_key:
                    raise fields.FieldError("Incorrect key", "api_key")

                user = super(models.core.Protected.Protected,self)._get(match={
                                      'name': username
                                      })
            else:
                user = super(models.core.Protected.Protected,self)._get(match={
                                      'name': username,
                                      'password': password
                                      })

        except models.mongodb.NotFoundError:
            self.warning("User {} does not exist or used wrong password".format(username))
            raise fields.FieldError("Username or password incorrect", "password")


        if not user['active']:
            self.warning("User {} cannot log in because its deactivated".format(username))
            raise fields.FieldError("This user is deactivated", "name")

        self.context.session['previous_session'] = None
        self.context.session['name'] = user['name']
        self.context.session['roles'] = user['roles']
        self.context.session['user_id'] = user['_id']
        self.context.session['group_ids']= user['group_ids']
        self.context.session['email']= user['email']

        #every user MUST to be member of everyone and user
        self.context.session['roles'].append('everyone')
        self.context.session['roles'].append('user')

        self.info("Logged in.")
        self.send_session()

        return(self.context.session)


    @RPC(roles="everyone")
    def get_all_global(self, api_key):
        '''get all users in all databases. only with api_key.'''
        if api_key!=settings.api_key:
            raise fields.FieldError("Incorrect key", "api_key")

        result=[]
        db_names=self.context.mongodb_connection.database_names()
        for db_name in db_names:
            if db_name.find(DB_PREFIX)==0:
                #determine domain
                domain=db_name.lstrip(DB_PREFIX).replace("_", ".")
                #get all users in this db
                db=self.context.mongodb_connection[db_name]
                users=db[self.default_collection].find(projection={ "name": True })
                for user in users:
                    result.append(user["name"]+"@"+domain)

        return(result)


    @RPC(roles=["everyone"])
    def send_session(self):
        '''get current loggedin session (broadcasts an event)'''

        self.event("changed_session",self.context.session)



    @RPC(roles=["everyone"])
    def logout(self):
        '''logout the user. name becomes anonymous, roles becomes everyone.
        '''
        if self.context.session['user_id'] == None:
            raise fields.FieldError("You're not logged in")

        self.info("Logged out")
        self.context.reset_user()

        self.event("changed_session",self.context.session)
