from models.common import *


class Users(Base):
    def __init__(self):
        print "init users"
        
    @acl(groups=["geert"])
    def test(self, params):
        print "de test!"


    def unwrappedtest(self, params):
        print "de unwrappedtest!"


