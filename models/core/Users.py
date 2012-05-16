from models.common import *


class Users(Base):
        
    @Acl(groups=["everyone"])
    def test(self, params):
        if hasattr(self.context,"bla"):
            self.context.bla=self.context.bla+1
        else:
            self.context.bla=1
            
        return ("de test nummer {}".format(self.context.bla))


    @Acl(groups="admin")
    def admin(self, params):
        return("ADMIN")

    @Acl("admin")
    def admin2(self, params):
        return("ADMIN")
    
    @Acl(groups=("everyone","admin","geert","test"))
    def geert(self, params):
        return("geert")


