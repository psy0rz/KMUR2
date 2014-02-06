
from models.common import Acl
import fields
import models.mongodb
import time

 
class Logs(models.mongodb.Base):
    '''logging functionality'''

    meta = fields.List(
            fields.Dict({
                        'name': fields.String(desc='Username'),
                        'user_id': models.mongodb.FieldId(desc='User ID', required=False),
                        'type': fields.Select(desc='Type', choices=[
                                                          ('info', 'Info'),
                                                          ('warning', 'Warning'),
                                                          ('error', 'Error')
                                                          ]),
                        'text': fields.String(desc='Log text'),
                        'module_name': fields.String(desc='Module name'),
                        'time': fields.Timestamp(desc='Time')
                        })
            ,list_key='_id'
            )

    def __init__(self, *args, **kwargs):
        self.last_logs = []
        super(Logs, self).__init__(*args, **kwargs)

    def __call__(self, log_type, text, module_name):
        '''add log text with specified type and text to logger
        '''
        log_entry = {
                      'name': self.context.session['name'],
                      'user_id': self.context.session['user_id'],
                      'type': log_type,
                      'text': text,
                      'time': time.time(),
                      'module_name': module_name
                    }

        self._put(log_entry)

        self.last_logs.append(log_entry)

    @Acl(roles="user")
    def get_all(self, **params):

        #non admins get forced filtering on own user_id
        if not self.context.has_roles("admin"):
            params['match'] = {'user_id': self.context.session['user_id']}

        return(self._get_all(**params))
