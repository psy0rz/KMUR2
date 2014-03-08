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
    def inc(self):
        self['xinvoice_nr']=self['xinvoice_nr']+1


    @Acl(roles="admin")
    def gt(self):
        return(self['xinvoice_nr'])


    @Acl(roles="admin")
    def ki(self):
        if 'invoice_nr' in self:
            print ("invoice_nr")

        if 'xinvoice_nr' in self:
            print ("xinvoice_nr")
              