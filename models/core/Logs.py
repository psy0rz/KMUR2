
from models.common import Acl
import fields
import models.mongodb
import time


class Logs(models.mongodb.MongoDB):
    '''logging functionality'''

    meta = fields.Dict({
                        'username': fields.String(desc='Username'),
                        'user_id': models.mongodb.FieldId(desc='User ID', required=False),
                        'type': fields.Select(desc='Type', choices={
                                                          'info': 'Info',
                                                          'warning': 'Warning',
                                                          'error': 'Error'
                                                          }),
                        'text': fields.String(desc='Log text'),
                        'module_name': fields.String(desc='Module name'),
                        'time': fields.Timestamp(desc='Time')
                        })

    def __init__(self, *args, **kwargs):
        self.last_logs = []
        super(Logs, self).__init__(*args, **kwargs)

    def __call__(self, log_type, text, module_name):
        '''add log text with specified type and text to logger
        '''
        log_entry = {
                      'username': self.context.username,
                      'user_id': self.context.user_id,
                      'type': log_type,
                      'text': text,
                      'time': time.time(),
                      'module_name': module_name
                    }

        self._put(log_entry)

        self.last_logs.append(log_entry)

    @Acl(groups="user")
    def get_all(self, **params):

        #non admins get forced filtering on own user_id
        if not self.context.has_groups("admin"):
            params['match'] = {'user_id': self.context.user_id}

        #NOTE: dont forget to explicitly set collection to None!
        #otherwise the user can look in every collection!
        return(self._get_all(collection=None, **params))
