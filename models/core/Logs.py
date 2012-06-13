
from models.common import Acl
import fields
import models.mongodb
import time


class Logs(models.mongodb.MongoDB):
    '''logging functionality'''

    @Acl(groups=["everyone"])
    def get_meta(self, doc=None):
        return(fields.Dict({
                            'username': fields.String(desc='Username'),
                            'user_id': models.mongodb.FieldId(desc='User ID'),
                            'type': fields.Select(desc='Type', choices={
                                                              'info': 'Info',
                                                              'warning': 'Warning',
                                                              'error': 'Error'
                                                              }),
                            'text': fields.String(desc='Log text'),
                            'time': fields.Timestamp(desc='Time')
                            }))

    def __call__(self, log_type, text):
        '''add log text with specified type and text to logger
        '''
        self._put("logs", {
                          'username': self.context.username,
                          'user_id': self.context.user_id,
                          'type': log_type,
                          'text': text,
                          'time': time.time()
                          })

    @Acl(groups="user")
    def get_all(self, **params):

        #non admins get forced filtering on own user_id
        if not self.context.has_groups("admin"):
            params['match'] = {'user_id': self.context.user_id}

        return(self._get_all("logs", **params))
