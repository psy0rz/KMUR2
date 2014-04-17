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
import time

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


        settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)
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

                    'currency': fields.String(desc='Currency', default=settings['currency'])

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

        #store the calculated results (so we always return the same results in the future according to tax rules)
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
    def send(self, _id):
        """send the invoice to the customer.

            Gives the invoice a invoice number and data if it hasnt got one already and marks it as sent.

            If the mail_to field is set in to_copy, the invoice is mailed to that address.
            If the print is true in to_copy, the invoice is printed.

            After this, most of the invoice cant be changed anymore, according to dutch tax rules.

        """

        doc=self.get(_id)

        if 'sent' in doc and doc['sent']==True:
            raise FieldError("Invoice is already sent")

        update_doc={}

        update_doc['_id']=_id
        update_doc['sent']=True

        if not 'invoice_nr' in doc:
            settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)
            settings['invoice_nr']=settings['invoice_nr']+1
            update_doc['invoice_nr']=settings['invoice_nr']
            update_doc['sent_date']=time.time()

        ret=self._put(update_doc)
        self.event("changed",ret)

        self.info("Invoice {invoice_nr} sent to {company}".format(invoice_nr=update_doc['invoice_nr'], company=doc['to_copy']['company']))


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
        #We dont do any processing: we always want to return the invoice in its original unaltered form, as this is required by tax-rules.
        #This way, even if we fix a bug in the calculation routines for example, the original invoice will still be returned.
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

        invoice=self.get(_id)

        if not 'sent' in invoice or invoice['sent']==False:
            raise FieldError("Invoice is not sent yet")


        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Frame, Preformatted, Spacer
        from io import BytesIO
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm    

        styles=getSampleStyleSheet()

        styles.add(ParagraphStyle(name='Small',
                                  parent=styles['Normal'],
                                  fontSize=8)
                   )

        # container for the 'Flowable' pdf objects
        pdf_elements = []
         
        #white space to allow room for headings on first page
        pdf_elements.append(Spacer(0,10*cm))

        #convert invoice items to table
        table_data=[]

        #items heading
        meta=self.get_meta().meta['meta'].meta['meta']['items'].meta['meta'].meta['meta']
        table_data.append(
            [
                meta['amount'].meta['desc'],
                meta['desc'].meta['desc'],
                meta['price'].meta['desc'],
                meta['tax'].meta['desc'],
                meta['calc_total'].meta['desc'],
                meta['calc_total_tax'].meta['desc'],
            ])

        #items
        for item in invoice['items']:
            table_data.append([
                    item['amount'],
                    Paragraph(item['desc'], styles["Normal"]),
                    "{} {}".format(invoice['currency'], item['price']),
                    "{}%".format(item['tax']),
                    "{} {}".format(invoice['currency'], item['calc_total']),
                    "{} {}".format(invoice['currency'], item['calc_total_tax'])
                ])

        #totals
        table_data.append([
            "",
            "",
            "",
            "Grand totals:",
            "{} {}".format(invoice['currency'], invoice['calc_total']),
            "{} {}".format(invoice['currency'], invoice['calc_total_tax']),
            ])

        #generate table and set cell styles
        table=Table(table_data, colWidths=[2*cm, 8*cm, 2*cm, 1*cm, 2*cm])
        table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-2), 0.5, colors.gray), #global grid (last line no grid)
                ('LINEBELOW', (0,0), (-1,0), 2, colors.black), #header line
                ('ALIGN', (-4,0), (-1,-1), 'RIGHT'), #right align last 4 colums
                ('ALIGN', (0,0), (0,-1), 'RIGHT'), #right align amount
                ('VALIGN', (0,0), (-1,-1), 'TOP'), #align all rows to top
                ('GRID', (-2,-1), (-1,-1), 0.5, colors.gray), #totals grid
                ('LINEABOVE', (-2,-1), (-1,-1), 2, colors.black), #totals line

            ]))
        pdf_elements.append(table)

        #print adress info and extra stuff on first page
        def first_page(canvas, pdf):
            canvas.saveState()

            #senders adress and company info
            from_frame=Frame(14*cm, 21*cm, 6*cm, 6*cm, showBoundary=0)
            from_frame.addFromList([
                Preformatted(
                    invoice['from_copy']['company']+"\n"+
                    invoice['from_copy']['address']+"\n"+
                    invoice['from_copy']['zip_code']+"  "+invoice['from_copy']['city'].upper()+"\n"+
                    invoice['from_copy']['province']+"\n"+
                    invoice['from_copy']['country']+"\n"+
                    "\n"+
                    invoice['from_copy']['mail_to']+"\n"+
                    "\n"+
                    "KVK: "+invoice['from_copy']['coc_nr']+"\n"+
                    "BTW: "+invoice['from_copy']['vat_nr']+"\n"+
                    "\n"+
                    "IBAN: "+invoice['from_copy']['iban_nr']+"\n"+
                    "BIC: "+invoice['from_copy']['bic_code']+"\n"
                    ,style=styles['Small']
                )
            ], canvas)
            canvas.restoreState()


        #generate pdf from elements
        buffer = BytesIO()
        pdf = SimpleDocTemplate(buffer, pagesize=A4)        
        pdf.build(pdf_elements, onFirstPage=first_page)
        buffer.seek(0)

        #create bottle-http response
        #doesnt seem to work correctly with Reponse, so we use HTTPResponse. bottle-bug?
        response=bottle.HTTPResponse(body=buffer)
        response.set_header('Content-Type', 'application/octet-stream')
        response.set_header('Content-Disposition', "attachment;filename=test.pdf"  );

        return(response)



