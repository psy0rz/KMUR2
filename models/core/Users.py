from models.common import *
import fields
import models.mongodb


class Users(models.mongodb.MongoDB):
    '''user management'''

    meta = fields.Dict({
                        'username': fields.String(min=3),
                        'password': fields.String(min=5),
                        'active': fields.Bool(),
                        'groups': fields.MultiSelect(choices={
                                                              "admin": "Administrator",
                                                              "employee": "Employee",
                                                              "customer": "Customer",
                                                              "finance": "Finance"
                                                            }),
                            })

    @Acl(groups="admin")
#    @Acl(groups="everyone")
    def put(self, **user):
        return(self._put("users", user))

    @Acl(groups="admin")
    def get(self, _id):
        return(self._get("users", _id))

    @Acl(groups="admin")
    def delete(self, _id):
        return(self._delete("users", _id))

    @Acl(groups="admin")
    def get_all(self, **params):
        return(self._get_all("users", **params))

    @Acl(groups=["everyone"])
    def authenticate(self, username, password):
        '''authenticate the with the specified username and password.

        if its ok, it doesnt throw an exception and returns nothing'''
        try:
            user = self._get("users", match={
                                  'username': username,
                                  'password': password
                                  })
        except models.mongodb.NotFound:
            raise fields.FieldException("Username or password incorrect", "password")

        if not user['active']:
            raise fields.FieldException("This user is deactivated", "username")

        self.context.username = user['username']
        self.context.groups = user['groups']
        self.context.user_id = str(user['_id'])

        #every user MUST to be member over everyone and user
        self.context.groups.append('everyone')
        self.context.groups.append('user')

    @Acl(groups=["everyone"])
    def logout(self):
        '''logout the user. username become anonymous, groups becomes everyone.
        '''
        self.context.reset_user()


