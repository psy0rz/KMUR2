from models.common import *
import fields
import models.mongodb

import models.core.Protected
import models.core.Groups
import re


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
                                                      "employee": "Employee",
                                                      "customer": "Customer",
                                                      "finance": "Finance"
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
            'set_on_create': False,
            'check': True
        },
    }

    read=write

    read_roles=["admin"]
    write_roles=read_roles

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed user {name}".format(**doc)
        else:
          log_txt="Created new user {name}".format(**doc)

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)

        return(ret)

    @Acl(roles="user")
    def get(self, _id):
        return(self._get(_id,fields={
                'password': False
            }))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted user {name}".format(**doc))

        return(ret)

    @Acl(roles="user")
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

    @Acl(roles=["everyone"])
    def login(self, name, password):
        '''authenticate the with the specified name and password.

        if its ok, it doesnt throw an exception and returns nothing'''

        if name.find("@")==-1:
            raise fields.FieldError("Please specify a valid name", "name")


        #select correct DB
        (username, domain)=name.split("@")
        db_postfix=re.sub("[^a-z0-9]","_",domain.lower())
        db_name=DB_PREFIX+"_"+db_postfix

        if db_name not in self.context.mongodb_connection.database_names():
            raise fields.FieldError("Domain not found", "name")


        self.context.session['db_name']=db_name
        self.reconnect(force=True)

        #FIXME: ugly temporary hack to bootstrap empty DB
        if username=="tmpadmin":
            self.context.session['roles'].append('everyone')
            self.context.session['roles'].append('user')
            self.context.session['roles'].append('admin')
            self.info("logged in via DEBUG HACK - REMOVE ME")
            return


        try:
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

        self.context.session['name'] = user['name']
        self.context.session['roles'] = user['roles']
        self.context.session['user_id'] = user['_id']
        self.context.session['group_ids']= user['group_ids']

        #every user MUST to be member over everyone and user
        self.context.session['roles'].append('everyone')
        self.context.session['roles'].append('user')

        self.info("Logged in.")

        #the frontend might need this information as well:
        return(self.context.session)

    @Acl(roles=["everyone"])
    def logout(self):
        '''logout the user. name becomes anonymous, roles becomes everyone.
        '''
        if self.context.user_id == None:
            raise fields.FieldError("You're not logged in")

        self.info("Logged out")
        self.context.reset_user()
