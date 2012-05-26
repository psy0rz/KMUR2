from models.common import *
import models.mongodb
from random import random

class Users(models.mongodb.MongoDB):


        
    @Acl(groups=["everyone"])
    def test(self, params):
        if hasattr(self.context,"bla"):
            self.context.bla=self.context.bla+1
        else:
            self.context.bla=1
            
        return ("de test nummer {}".format(self.context.bla))

    @Acl(groups=["everyone"])
    def add(self, params):
        self.db.User.insert(params)
        return(params)

    @Acl(groups=["everyone"])
    def get_all(self, params):
        return(self.db.User.find())


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


