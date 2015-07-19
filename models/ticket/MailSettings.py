import fields
import models.core.UserSettings
import models.ticket.Tickets

from models.common import *

class MailSettings(models.core.UserSettings.UserSettings):

    admin_read_roles=["finance_read"]
    admin_write_roles=["finance_admin"]

    @RPC(roles=["everyone"])
    def get_meta(self, *args, _id=None, **kwarg):

        meta = fields.List(
                fields.Dict({
                    'email_forward': fields.Email(desc='Forward to'),
                    'email_dont_forward': fields.List(
                        fields.Dict({
                            'email': fields.Email(desc='Email address'),

                        }),
                        desc='Dont forward email from'
                    ),
                    'ticket_status':        models.ticket.Tickets.Tickets.meta.meta['meta'].meta['meta']['ticket_status'],
                    'copy_relation_permissions': fields.Bool(desc='Use same permissions as relation has (recommended)', default=True),
                    'mail_date':            fields.Bool(desc='Use send-date instead of current date (not recommended)', default=False),
                    'skip_duplicates':      fields.Bool(desc='Skip duplicate mails by checking if message-id is already imported', default=True),
                    'due_days':             fields.Number(desc='Set due date to this many days in the future', default=1),
                    'reset_completed':      fields.Bool(desc='Reset completed status', default=False),
                    'reset_status':         fields.Bool(desc='Reset ticket status', default=True),
                    'reset_due_days':       fields.Bool(desc='Reset due days', default=False),
                    'update_relations':      fields.Bool(desc='Update relations', default=True),
                    'always_create':        fields.Bool(desc='Also create tickets for unknown email adresses. (not recommended)', default=False),
                    'trackable':             fields.String(desc='Ticket id prepend string', default='ticket id: '),
                })
            )
        return(meta)


