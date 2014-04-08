from models.common import *
import fields
import models.core.Protected
import models.core.Users
import models.core.Groups
import models.mongodb
import models.ticket.Relations
import models.ticket.InvoiceSettings
import time
from fields import FieldError
import bottle

class Invoices(models.core.Protected.Protected):
    '''Invoicing module
    '''

    
    @Acl(roles=["everyone"])
    def get_meta(self, *args, _id=None, **kwarg):

        readonly=False

        if _id:
            #if the stored invoice is already sent, then make some stuff readonly
            doc=self.get(_id)
            if 'sent' in doc and doc['sent']:
                readonly=True


        # settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)
        # status_choices=[]

        # for choice in settings['invoice_status']:
        #     status_choices[]

        return(
            fields.List(
                fields.Dict({
                    '_id': models.mongodb.FieldId(),

                    'title': fields.String(desc='Title', default='Invoice'),

                    #filled automatcly when invoice is "sent"
                    #after sending, most of the invoice may no longer be changed
                    'invoice_nr': fields.Number(desc='Invoice number',readonly=readonly),
                    'sent': fields.Bool(desc='Sent'),
                    'sent_date': fields.Timestamp(desc='Invoice date',readonly=readonly),

                    #filled automaticly when invoice is "payed"
                    'payed': fields.Bool(desc='Payed'),
                    'payed_date': fields.Timestamp(desc='Payed date'),


                    'allowed_groups': models.mongodb.Relation(
                        desc='Groups with access',
                        model=models.core.Groups.Groups,
                        resolve=False,
                        check_exists=False,
                        list=True),
                    'allowed_users': models.mongodb.Relation(
                        desc='Users with access',
                        model=models.core.Users.Users,
                        resolve=False,
                        check_exists=False,
                        list=True),

                    'from_relation': models.mongodb.Relation(
                        desc='From',
                        model=models.ticket.Relations.Relations,
                        resolve=False,
                        check_exists=True,
                        list=False,
                        min=1,
                        readonly=readonly),
                    'to_relation': models.mongodb.Relation(
                        desc='Customer',
                        model=models.ticket.Relations.Relations,
                        resolve=False,
                        check_exists=True,
                        list=False,
                        min=1,
                        readonly=readonly),

                    #invoice-data should be immutable once they're sent to the customer
                    'from_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],
                    'to_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],

                    'items': fields.List(
                        fields.Dict({
                                'amount': fields.Number(desc='Amount',size=5, decimals=2),
                                'desc': fields.String(desc='Description', size=80),
                                'price': fields.Number(desc='Price', size=5,decimals=2),
                                'tax': fields.Number(desc='Tax', default=21, size=5, decimals=2),
                                'calc_total': fields.Number(desc='Total',decimals=2),
                                'calc_total_tax': fields.Number(desc='with tax',decimals=2),
                            }),
                        desc="Invoice items",
                        readonly=readonly
                    ),
                    'calc_total': fields.Number(desc='Total', decimals=2, readonly=readonly),
                    'calc_total_tax': fields.Number(desc='with tax', decimals=2, readonly=readonly),

                    'notes': fields.String(desc='Notes'),

                }),
                list_key='_id'
            )
        )

    write={
        'allowed_groups': {
            'context_field': 'group_ids',
            'check': True
        },
        'allowed_users': {
            'context_field': 'user_id',
            'check': True
        },
    }

    read=write

    @Acl(roles="finance")
    def put(self, **doc):

        #precheck, to prevent confusing errors for the enduser later on
        self.get_meta(doc).meta['meta'].check(self.context, doc)

        settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)

        if 'sent' in doc:
            raise FieldError("Cant modify sent-status this way")

        if 'items' in doc:
            doc=self.calc(**doc)


        if 'to_relation' in doc:
            doc['to_copy']=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['to_relation'])['invoice']
            doc['from_relation']=settings['from_relation']
            doc['from_copy']=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['from_relation'])['invoice']

        if '_id' in doc:
          log_txt="Changed invoice {title}".format(**doc)
        else:
          log_txt="Created new invoice {title}".format(**doc)

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)


        return(ret)



    @Acl(roles="finance")
    def calc(self, **doc):
        """returns a calculated version of doc

        used internally as well as by frontends

        performs roundings according to dutch tax rules: http://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/btw-bedrag_afronden

        well..not exactly:

        In [28]: round(3.33500001,2)
        Out[28]: 3.34

        In [29]: round(3.33500000,2)
        Out[29]: 3.33

        so we're only rounding UP when its >0.005, not >=0.005, but in practice this makes no difference.

        """
#        time.sleep(2)
#        self.get_meta(doc).meta['meta'].check(self.context, doc)
        doc['calc_total']=0
        doc['calc_total_tax']=0
        for item in doc['items']:
            try:
                item['calc_total']=round(item['amount']*item['price'],2)
                item['calc_total_tax']=round(item['calc_total']+(item['calc_total']*item['tax']/100),2)
                doc['calc_total']+=item['calc_total']
                doc['calc_total_tax']+=item['calc_total_tax']
            except:
                item['calc_total']=None
                item['calc_total_tax']=None


        doc['calc_total']=round(doc['calc_total'],2)
        doc['calc_total_tax']=round(doc['calc_total_tax'],2)

        return(doc)

    @Acl(roles="finance")
    def get(self, _id):
        # return(self.calc(**self._get(_id)))
        return(self._get(_id))

    @Acl(roles="finance")
    def delete(self, _id):

        doc=self._get(_id)

        if 'send' in doc and doc['sent']:
            raise FieldError("invoice already was sent, cannot change or delete it.")

        if 'invoice_nr' in doc:
            raise FieldError("invoice already has an invoice_nr, its NOT allowed to have holes in your bookkeeping so you can never delete this one.")


        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted invoice {title}".format(**doc))

        return(ret)

    @Acl(roles="finance")
    def get_all(self, **params):
        return(self._get_all(**params))



    """downloads pdf version of the invoice """
    @Acl(roles="finance")
    def get_pdf(self,_id):

        # from reportlab.lib.pagesizes import letter, A4
        # from reportlab.lib.enums import TA_RIGHT
        # from reportlab.pdfbase import pdfmetrics
        # from reportlab.pdfbase.ttfonts import TTFont
        # from reportlab.platypus import SimpleDocTemplate, Paragraph
        # from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        # from reportlab.lib.enums import TA_CENTER
        # from io import BytesIO
    
        # buffer = BytesIO()

        # doc = SimpleDocTemplate(buffer,
        #                         rightMargin=72,
        #                         leftMargin=72,
        #                         topMargin=72,
        #                         bottomMargin=72,
        #                         pagesize=A4)
 
        # # Our container for 'Flowable' objects
        # elements = []
 
        # # A large collection of style sheets pre-made for us
        # styles = getSampleStyleSheet()
        # # styles.add(ParagraphStyle(name='RightAlign', fontName='Arial', alignment=TA_RIGHT))
        # styles.add(ParagraphStyle(name='RightAlign', alignment=TA_RIGHT))
 
        # # Draw things on the PDF. Here's where the PDF generation happens.
        # # See the ReportLab documentation for the full list of functionality.
        # elements.append(Paragraph('My User Names', styles['RightAlign']))
 
        # # Need a place to store our table rows
        # table_data = [
        #     [ "geert", "moi", "keutel"],
        #     [ "geert", "moi", "keutel"],
        #     [ "geert", "moi", "keutel"],
        #     [ "geert", "moi", "keutel"],
        # ]


        # # Create the table
        # user_table = Table(table_data, colWidths=[doc.width/3.0]*3)
        # # user_table.setStyle(TableStyle([('INNERGRID', (0, 0), (-1, -1), 0.25, colors.black),
        # #                                 ('BOX', (0, 0), (-1, -1), 0.25, colors.black)]))
        # elements.append(user_table)
        # # doc.build(elements, onFirstPage=self._header_footer, onLaterPages=self._header_footer,
        # #           canvasmaker=NumberedCanvas)
        # doc.build(elements)
 
        # # Get the value of the BytesIO buffer and write it to the response.
        # # pdf = buffer.getvalue()
        # # buffer.close()
        # return (buffer)


        # return bottle.static_file("blah.pdf", root="/", download=True)


        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
        from io import BytesIO
    
        buffer = BytesIO()
         
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        # container for the 'Flowable' objects
        elements = []
         
        data= [['00', '01', '02', '03', '04'],
               ['10', '11', '12', '13', '14'],
               ['20', '21', '22', '23', '24'],
               ['30', '31', '32', '33', '34']]
        t=Table(data)
        t.setStyle(TableStyle([('BACKGROUND',(1,1),(-2,-2),colors.green),
                               ('TEXTCOLOR',(0,0),(1,-1),colors.red)]))
        elements.append(t)
        doc.build(elements)
        buffer.seek(0)

        return(buffer)



