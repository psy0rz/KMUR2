from models.common import *


class Users(Base):
        
    @Acl(groups=["geert"])
    def test(self, params):
        print ("TEST")
        return ("de test!")


    def unwrappedtest(self, params):
        return "de unwrappedtest!"


