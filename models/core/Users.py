from models.common import *
import fields
import models.mongodb

class Users(models.mongodb.MongoDB):

    @Acl(groups=["everyone"])
    def get_meta(self, doc):
        return(fields.Dict({
                            'username': fields.String()
                            }))

        
    @Acl(groups=["everyone"])
    def test(self, params):
        if hasattr(self.context,"bla"):
            self.context.bla=self.context.bla+1
        else:
            self.context.bla=1
            
        return ("de test nummer {}".format(self.context.bla))

    @Acl(groups=["everyone"])
    def add(self, **user):
        
        self.db.User.insert(user)
        return(user)

    @Acl(groups=["everyone"])
    def put(self, **user):
        return(self._put("users",user))

    @Acl(groups=["everyone"])
    def get(self, _id):
        return(self._get("users",_id))

    @Acl(groups=["everyone"])
    def delete(self, _id):
        return(self._delete("users",_id))

    @Acl(groups=["everyone"])
    def get_all(self, **params):
        return(self.db.users.find())


    @Acl(groups=["everyone"])
    def test(self, params):
        from models import field
        t=field.Dict({
            'poep':field.Number(min=0, max=100,decimals=2,desc='jojojo'),
            'tijd':field.Timestamp(desc='hoe loat ist')
            })
        return(t)


    @Acl(groups="admin")
    def admin(self, params):
        return("ADMIN")

    @Acl("admin")
    def admin2(self, params):
        return("ADMIN")
    
    @Acl(groups=("everyone","admin","geert","test"))
    def geert(self, params):
        return("geert")


