from models.common import *
import fields
import models.core.ModuleSettings

class InvoiceSettings(models.core.ModuleSettings.ModuleSettings):
    
    meta = fields.List(
            fields.Dict({
                'invoice_nr': fields.Number(desc='Next invoice number'),
            }),
        )



    @Acl(roles="admin")
    def test(self):
        self['invoice_nr']=self['invoice_nr']+1


