import fields
import models.core.ModuleSettings
import models.ticket.Relations

class InvoiceSettings(models.core.ModuleSettings.ModuleSettings):
    
    meta = fields.List(
            fields.Dict({
                'invoice_nr': fields.Number(desc='Next invoice number', default=0),
                'from_relation': models.mongodb.Relation(
                    desc='Send invoices from',
                    model=models.ticket.Relations.Relations,
                    resolve=False,
                    check_exists=True,
                    list=False),
            }),

        )

