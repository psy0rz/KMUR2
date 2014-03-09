from models.common import *
import fields
import models.core.ModuleSettings

class InvoiceSettings(models.core.ModuleSettings.ModuleSettings):
    
    meta = fields.List(
            fields.Dict({
                'invoice_nr': fields.Number(desc='Next invoice number', default=0),
            }),
        )

