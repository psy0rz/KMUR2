import fields
import models.core.ModuleSettings
import models.ticket.Relations

class InvoiceSettings(models.core.ModuleSettings.ModuleSettings):
    
    meta = fields.List(
            fields.Dict({
                'invoice_nr': fields.Number(desc='Next invoice number', default=0),
                'currency': fields.String(desc='Currency symbol', default='€'),
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


