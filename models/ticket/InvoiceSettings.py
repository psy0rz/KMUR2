import fields
import models.core.ModuleSettings
from models.common import *

class InvoiceSettings(models.core.ModuleSettings.ModuleSettings):

    admin_read_roles=["finance_read"]
    admin_write_roles=["finance_admin"]

    @RPC(roles=["everyone"])
    def get_meta(self, *args, _id=None, **kwarg):
        import models.ticket.Relations

        meta = fields.List(
                fields.Dict({
                    'invoice_nr': fields.Number(desc='Last invoice number', default=0),
                    'invoice_nr_format': fields.String(desc='Invoice number format', default="2014-{:04}"),
                    'currency': fields.String(desc='Default currency', default='€'),
                    'from_relation': models.mongodb.Relation(
                        desc='Send invoices from',
                        model=models.ticket.Relations.Relations,
                        resolve=False,
                        check_exists=True,
                        list=False),
                    'global_notes': fields.String(desc='Global invoice notes', default='Please transfer the specified amount within 14 days to the the bankaccount mentioned above. Add {invoice_nr} to the description field.'),
                    'email_printer': fields.Email(desc='Printer email address', required=False),
                    'email_subject': fields.String(desc='Email subject', default='Invoice {invoice_nr}'),
                    'email_body': fields.String(desc='Email body', default='Invoice {invoice_nr} is attached to this email.'),
                    'invoice_status': fields.List(
                        fields.Dict({
                                'title': fields.String(desc="Title",min=3),
                                'days': fields.Number(desc="Auto-set after days",min=0),
                            }),
                        desc="Invoice statuses"
                    ),
                }),
            )

        return(meta)


    @RPC(admin_write_roles)
    def put(self, **doc):
        # if not '{}' in doc['invoice_nr_format']:
        #     raise fields.FieldError('Formatstring should contain {}', 'invoice_nr_format')

        super().put(**doc)
