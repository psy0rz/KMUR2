import fields
import models.core.UserSettings

from models.common import *

class UserSettings(models.core.UserSettings.UserSettings):

    admin_read_roles=["finance_read"]
    admin_write_roles=["finance_admin"]

    @RPC(roles=["everyone"])
    def get_meta(self, *args, _id=None, **kwarg):

        meta = fields.List(
                fields.Dict({
                    'email_forward': fields.Email(desc='Forward incoming mails to email address'),
                    'email_send': fields.List(
                        fields.Dict({
                            'email': fields.Email(desc='Email address'),

                        }),
                        desc='Dont forward email from'
                    )
                })
            )
        return(meta)


