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