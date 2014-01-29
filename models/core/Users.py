from models.common import *
import fields
import models.mongodb

import models.core.Groups

class Users(models.mongodb.Base):
    '''user management'''
    
    meta = fields.List(
            fields.Dict({
                '_id': models.mongodb.FieldId(),
                'name': fields.String(min=3, desc='Username'),
                'password': fields.Password(min=5, desc='Password'),
                'active': fields.Bool(desc="Enabled", default=True),
                'roles': fields.MultiSelect(desc="Roles of the user",
                                             choices={
                                                      #make this configurable in a seperate group-module?
                                                      #All users, including anonymous, have role'everyone'.
                                                      #All users, except anonymous, have role 'user'
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
                'group_ids': models.mongodb.Relation(
                    desc='Groups this user belongs to',
                    model=models.core.Groups.Groups,
                    resolve=False,
                    list=True)
            }),
            list_key='_id'
        )

    @Acl(roles="admin")
    def put(self, **doc):

        if '_id' in doc:
          log_txt="Changed user {name}".format(**doc)
        else:
          log_txt="Created new user {name}".format(**doc)

        ret=self._put(doc)

        self.info(log_txt)

        return(ret)

    @Acl(roles="admin")
    def get(self, _id):
        return(self._get(_id))

    @Acl(roles="admin")
    def delete(self, _id):

        doc=self._get(_id)

        ret=self._delete(_id)

        self.info("Deleted user {name}".format(**doc))

        return(ret)

    @Acl(roles="admin")
    def get_all(self, **params):
        return(self._get_all(**params))

    @Acl(roles=["everyone"])
    def login(self, name, password):
        '''authenticate the with the specified name and password.

        if its ok, it doesnt throw an exception and returns nothing'''

        #FIXME: ugly temporary hack to bootstrap empty DB
        if name=="tmpadmin":
            self.context.session['roles'].append('everyone')
            self.context.session['roles'].append('user')
            self.context.session['roles'].append('admin')
            self.info("logged in via DEBUG HACK - REMOVE ME")
            return


        try:
            user = self._get(match={
                                  'name': name,
                                  'password': password
                                  })

        except models.mongodb.NotFound:
            self.warning("User {} does not exist or used wrong password".format(name))
            raise fields.FieldException("Username or password incorrect", "password")

        if not user['active']:
            self.warning("User {} cannot log in because its deactivated".format(name))
            raise fields.FieldException("This user is deactivated", "name")

        self.context.session['name'] = user['name']
        self.context.session['roles'] = user['roles']
        self.context.session['user_id'] = user['_id']
        self.context.session['group_ids']= user['group_ids']

        #every user MUST to be member over everyone and user
        self.context.session['roles'].append('everyone')
        self.context.session['roles'].append('user')

        self.info("Logged in.")

    @Acl(roles=["everyone"])
    def logout(self):
        '''logout the user. name becomes anonymous, roles becomes everyone.
        '''
        if self.context.user_id == None:
            raise fields.FieldException("You're not logged in")

        self.info("Logged out")
        self.context.reset_user()
