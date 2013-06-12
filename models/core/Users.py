from models.common import *
import fields
import models.mongodb
from models import mongodb

import models.core.Companies

class Users(models.mongodb.MongoDB):
    '''user management'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'username': fields.String(min=3, desc='Username'),
                'password': fields.Password(min=5, desc='Password'),
                'active': fields.Bool(desc="Enabled", default=True),
                'groups': fields.MultiSelect(desc="Groups",
                                             choices={
                                                      #make this configurable in a seperate group-module?
                                                      #All users, including anonymous, are member of 'everyone'.
                                                      #All users, except anonymous, are member of 'user'
                                                      "admin": "Administrator",
                                                      "employee": "Employee",
                                                      "customer": "Customer",
                                                      "finance": "Finance"
                                                    }),



                'fullname': fields.String(desc='Full name'),
                'emails': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'email': fields.Email(desc='Email address')
                        }),
                    desc="Email adresses"
                ),
                'phones': fields.List(
                    fields.Dict({
                            'desc': fields.String(desc='Description'),
                            'phone': fields.Phone(desc='Phone number')
                        }),
                    desc="Phone numbers"
                ),
                'company_ids': models.mongodb.Relation(
                    desc='Companies this user belongs to',
                    module="core",
                    cls="Companies")
            }),
            list_key='_id'
        )

    @Acl(groups="admin")
    def put(self, **user):

        if '_id' in user:
          log_txt="Changed user {}".format(user['username'])
        else:
          log_txt="Created new user {}".format(user['username'])

        ret=self._put(user)

        self.info(log_txt)

        return(ret)

    @Acl(groups="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(groups="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted user {}".format(doc['username']))

        return(ret)

    @Acl(groups="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

    @Acl(groups=["everyone"])
    def login(self, username, password):
        '''authenticate the with the specified username and password.

        if its ok, it doesnt throw an exception and returns nothing'''

        #FIXME: ugly temporary hack to bootstrap empty DB
        if username=="admin":
            self.context.groups.append('everyone')
            self.context.groups.append('user')
            self.context.groups.append('admin')
            self.info("logged in via DEBUG HACK - REMOVE ME")
            return


        try:
            user = self._get(match={
                                  'username': username,
                                  'password': password
                                  })

        except models.mongodb.NotFound:
            self.warning("User {} does not exist or used wrong password".format(username))
            raise fields.FieldException("Username or password incorrect", "password")

        if not user['active']:
            self.warning("User {} cannot log in because its deactivated".format(username))
            raise fields.FieldException("This user is deactivated", "username")

        self.context.username = user['username']
        self.context.groups = user['groups']
        self.context.user_id = str(user['_id'])

        #every user MUST to be member over everyone and user
        self.context.groups.append('everyone')
        self.context.groups.append('user')

        self.info("Logged in.")

    @Acl(groups=["everyone"])
    def logout(self):
        '''logout the user. username becomes anonymous, groups becomes everyone.
        '''
        if self.context.user_id == None:
            raise fields.FieldException("You're not logged in")

        self.info("Logged out")
        self.context.reset_user()
