import core.model


class acl(object):
    def __init__(self, groups=["admin"]):
        self.groups = groups

    def __call__(self, f):
        def wrapped_f(wrapped_instance, *args):
            print "in wrapperrr"
            print self.groups
            #...controleer of de gebruk
            f(wrapped_instance, *args)

        #we want to be able to verify if the outer wrapper is an acl_wrapper            
        wrapped_f.has_acl_decorator=1
        return wrapped_f

        

class users():
    def __init__(self):
        print "init users"
        
    @acl(groups=["geert"])
    def test(self, params):
        print "de test!"


    def unwrappedtest(self, params):
        print "de unwrappedtest!"


