from models.common import *
import fields
import models.mongodb

class Users(models.mongodb.MongoDB):
    '''user management'''

    @Acl(groups=["everyone"])
    def get_meta(self, doc=None):
        return(fields.Dict({
                            'username': fields.String(min=3),
                            'password': fields.String(min=5),
                            'active': fields.Bool(),
                            'groups': fields.MultiSelect(choices={
                                                                  "admin":"Administrator",
                                                                  "employee":"Employee",
                                                                  "customer":"Customer",
                                                                  "finance":"Finance"
                                                                })
                            }))

    @Acl(groups="admin")
    def put(self, **user):
        return(self._put("users",user))

    @Acl(groups="admin")
    def get(self, _id):
        return(self._get("users",_id))

    @Acl(groups="admin")
    def delete(self, _id):
        return(self._delete("users",_id))

    @Acl(groups="admin")
    def get_all(self, **params):
        return(self._get_all("users",**params))

    @Acl(groups=["everyone"])
    def authenticate(self, username ,password):
        '''authenticate the with the specified username and password. 
        
        if its ok, it doesnt throw an exception and returns nothing'''
        try:
            user=self._get("users", match={
                                  'username':username,
                                  'password':password
                                  })
        except models.mongodb.NotFound:
            raise fields.FieldException("Username or password incorrect", "password")

        if not user['active']:
            raise fields.FieldException("This user is deactivated", "username")
        
        self.context.username=user['username']
        self.context.groups=user['groups']

        #everyone MUST to be member over everyone
        self.context.groups.append('everyone')
            

    @Acl(groups=["everyone"])
    def logout(self):
        self.context.reset_user()
        
    
