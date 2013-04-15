from models.common import *
import fields
import models.mongodb
from models import mongodb


class Users(models.mongodb.MongoDB):
    '''user management'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'username': fields.String(min=3, desc='Username'),
                'password': fields.Password(min=5, desc='Password'),
                'fullname': fields.Password(desc='Full name'),
                'active': fields.Bool(desc="Enabled", default=True),
                'groups': fields.MultiSelect(choices={
                                                      #make this configurable in a seperate group-module?
                                                      #All users, including anonymous, are member of 'everyone'.
                                                      #All users, except anonymous, are member of 'user'
                                                      "admin": "Administrator",
                                                      "employee": "Employee",
                                                      "customer": "Customer",
                                                      "finance": "Finance"
                                                    }),
            }),
            list_key='_id'
        )

    @Acl(groups="admin")
    def put(self, **user):
        return(self._put(user))

    @Acl(groups="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(groups="admin")
    def delete(self, _id):
        return(self._delete(_id))

    @Acl(groups="admin")
    def get_all(self, **params):
        #NOTE: dont forget to explicitly set collection to None!
        #otherwise the user can look in every collection!
        return(self._get_all(collection=None, **params))

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
