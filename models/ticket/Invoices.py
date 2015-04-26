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

from_format="""{company}
{department}
{address}
{zip_code}  {city}
{province}
{country}

{mail_to}

KVK-nr.: {coc_nr}
BTW-nr.: {vat_nr}

IBAN: {iban_nr}
BIC: {bic_code}
"""

retour_format=">> Retouradres: {address}, {zip_code}, {city}, ({country})"

to_format="""{company}
{department}
{address}
{zip_code}  {city}
{country}
"""

date_format="""Invoice date: %d-%m-%Y"""
invoice_format="""Invoice number: {invoice_nr}"""

class Invoices(models.core.Protected.Protected):
    '''Invoicing module
    '''

    
    @RPC(roles=["finance_read"])
    def get_meta(self, *args, _id=None, **kwarg):

        readonly=False

        # print("id",args, _id, kwarg)

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
                    'invoice_nr': fields.String(desc='Invoice number',readonly=readonly),
                    'import_id': fields.String(desc='Import ID'),
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

                    #invoice-data should be immutable once they're sent to the customer, so we make a copy
                    'from_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],
                    'to_copy': models.ticket.Relations.Relations.meta.meta['meta'].meta['meta']['invoice'],

                    'items': fields.List(
                        fields.Dict({
                                'amount': fields.Number(desc='Amount',size=5, decimals=3),
                                'desc': fields.String(desc='Description', size=80),
                                'price': fields.Number(desc='Per item', size=5,decimals=3),
                                'tax': fields.Number(desc='Tax', default=21, size=5, decimals=3,min=0, max=100),
                                'calc_total': fields.Number(desc='Total excl.' ,decimals=3),
                                'calc_tax': fields.Number(desc='Total tax', decimals=2, readonly=readonly),
                                'calc_total_tax': fields.Number(desc='Total incl.',decimals=3),
                            }),
                        desc="Invoice items",
                        readonly=readonly
                    ),
                    'calc_total': fields.Number(desc='Total excl.', decimals=2, readonly=readonly),
                    'calc_tax': fields.Number(desc='Total tax', decimals=2, readonly=readonly),
                    'calc_total_tax': fields.Number(desc='Total incl.', decimals=2, readonly=readonly),

                    'notes': fields.String(desc='Notes'),

                    'currency': fields.String(desc='Currency', default=settings['currency'], readonly=readonly)

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

    #finance admin has full access
    admin_read_roles=[ "finance_admin" ]

    @RPC(roles="finance_admin")
    def put(self, force=False,**doc):

        #precheck, to prevent confusing errors for the enduser later on
        self.get_meta(**doc).meta['meta'].check(self.context, doc)

        settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)

        #use force to skip these checks. this is only recommend for imported invoices from external systems
        if not force:
            if 'invoice_nr' in doc or 'sent_date' in doc:
                raise FieldError("Cant set invoice nr or sent_date this way")


            if 'from_copy' in doc or 'to_copy' in doc:
                raise FieldError("Cant set from_copy or to_copy this way")

            if 'sent' in doc:
                raise FieldError("Cant modify sent-status this way")

        #make sure its always set to make coding easier in other parts in this module
        if not '_id' in doc and not force:
            doc['invoice_nr']=""
            doc['sent']=False
            doc['payed']=False

        #store the calculated results (so we always return the same results in the future according to tax rules)
        if 'items' in doc:
            doc=self.calc(**doc)


        if 'to_relation' in doc:
            doc['to_copy']=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['to_relation'])['invoice']
            doc['from_relation']=settings['from_relation']
            doc['from_copy']=call_rpc(self.context, 'ticket', 'Relations', 'get', doc['from_relation'])['invoice']


        if '_id' in doc:
            old_doc=self.get(doc['_id'])
            log_txt="Changed invoice {invoice_nr} for {company}".format(invoice_nr=old_doc['invoice_nr'], company=old_doc['to_copy']['company'])
        else:
            log_txt="Created new invoice for {company}".format(invoice_nr=doc['invoice_nr'], company=doc['to_copy']['company'])

        ret=self._put(doc)
        self.event("changed",ret)

        self.info(log_txt)


        return(ret)


    @RPC(roles="finance_admin")
    def send(self, _id):
        """send the invoice to the customer.

            Gives the invoice a invoice number and data if it hasnt got one already and marks it as sent.

            Also update the to_relation and from_relation address data.

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
        update_doc['to_relation']=doc['to_relation']

        if doc['invoice_nr']=="":
            settings=models.ticket.InvoiceSettings.InvoiceSettings(self.context)
            settings['invoice_nr']=settings['invoice_nr']+1
            update_doc['invoice_nr']=settings['invoice_nr_format'].format(settings['invoice_nr'])
            update_doc['sent_date']=time.time()

        self.put(force=True, **update_doc)

        doc=self._get(_id)
        self.event("changed",doc)
        self.info("Invoice {invoice_nr} sent to {company}".format(invoice_nr=doc['invoice_nr'], company=doc['to_copy']['company']))

    @RPC(roles="finance_admin")
    def revoke(self, _id):
        """revoke an invoice thats already been send (e.g. unsend it)

            Make sure to destroy any printed invoice that you or the customer have.

            After revoking an invoice you can edit it. Use this to make corrections on invoice you havent actually send in real life yet.

            Try to prevent this, the offical way to revert an invoice it to make a credit invoice. 
        """

        doc=self.get(_id)

        if doc['sent']==False:
            raise FieldError("Invoice is not sent yet.")

        doc['sent']=False
        doc['payed']=False

        ret=self._put(doc)
        self.event("changed",ret)
        self.warning("Revoked invoice {invoice_nr} sent to {company}. Dont forget to destroy all copies.".format(invoice_nr=doc['invoice_nr'], company=doc['to_copy']['company']))


    @RPC(roles="finance_admin")
    def add_items(self, to_relation, items, currency):
        """adds specified items to the an unsent invoice of to_relation. if there is no unsent invoice it will create a new one.
        """


        #find a unsent invoice
        invoices=self.get_all(
            match={
                'to_relation':to_relation,
                'sent': False,
                'currency': currency
            },
            limit=1,
            sort=[ ( '_id', 1) ]
        )

        #use existing
        if len(invoices)>0:
            update_doc={
                '_id': invoices[0]['_id'],
                'items': invoices[0]['items'],
                'notes': invoices[0]['notes']
            }
            update_doc['items'].extend(items)
            ret=self.put(**update_doc)
        #create new invoice
        else:
            new_doc={
                'to_relation': to_relation,
                'items':    items,
                'currency': currency,
                'allowed_users': [ self.context.session['user_id'] ],
                'title': "Invoice",
                'notes': ''
            }
            ret=self.put(**new_doc)
            
        return(ret)

    @RPC(roles="finance_admin")
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
        doc['calc_total']=0
        doc['calc_tax']=0
        doc['calc_total_tax']=0
        for item in doc['items']:
            try:
                item['calc_total']=round(item['amount']*item['price'],2)
                item['calc_tax']=round(item['calc_total']*item['tax']/100)
                item['calc_total_tax']=item['calc_total']+item['calc_tax']
                doc['calc_total']+=item['calc_total']
                doc['calc_tax']+=item['calc_tax']
                doc['calc_total_tax']+=item['calc_total_tax']
            except:
                item['calc_total']=None
                item['calc_tax']=None
                item['calc_total_tax']=None


        doc['calc_total']=round(doc['calc_total'],2)
        doc['calc_tax']=round(doc['calc_tax'],2)
        doc['calc_total_tax']=round(doc['calc_total_tax'],2)

        return(doc)

    @RPC(roles="finance_read")
    def get(self, _id, unaltered=False):

        if unaltered:
            #Dont do any processing: we always want to return the invoice in its original unaltered form, as this is required by tax-rules.
            #This way, even if we fix a bug in the calculation routines for example, the original invoice will still be returned.
            return(self._get(_id))
        else:
            #Usually we want to recalculate, in case of updates in the calculation. (we've added calc_tax later for example)
            return(self.calc(**self._get(_id)))


    @RPC(roles="finance_admin")
    def delete(self, _id):

        doc=self._get(_id)

        if 'sent' in doc and doc['sent']:
            raise FieldError("invoice already was sent, cannot change or delete it. you have to revoke it first.")

        if doc['invoice_nr']!="":
            raise FieldError("invoice already has an invoice_nr, its NOT allowed to have holes in your bookkeeping so you can never delete this one.")


        ret=self._delete(_id)
        self.event("deleted",ret)

        self.info("Deleted invoice {invoice_nr} to {company}".format(invoice_nr=doc['invoice_nr'], company=doc['to_copy']['company']))

        return(ret)


    @RPC(roles="finance_read")
    def get_all(self, **params):
        return(self._get_all(**params))


    """get csv export of all sent invoices"""
    @RPC(roles="finance_admin")
    def get_all_csv(self, days):

        import locale
        locale.setlocale(locale.LC_ALL, 'nl_NL.UTF-8')


        csv_data=""

        invoices=self.get_all(
            match={ "sent": True },
            gte={ "sent_date": time.time()- ( int(days)*24*3600)},
            sort=[ [ "sent_date" ,1 ] ]
            )

        for invoice in invoices:
            cols=[]
            cols.append(invoice["to_copy"]["customer_nr"])
            cols.append(invoice["to_copy"]["company"])
            cols.append(invoice["invoice_nr"])
            cols.append(time.strftime("%Y-%m-%d", time.localtime(invoice['sent_date'])))
            cols.append(locale.currency(invoice["calc_total_tax"], symbol=False, grouping=False))
            cols.append(locale.currency(invoice["calc_total_tax"]-invoice["calc_total"], symbol=False, grouping=False))

            stripped_cols=[]
            for col in cols:
                stripped_cols.append(str(col).replace(";","_"))
            csv_data+=";".join(stripped_cols)+"\n"


        response=bottle.HTTPResponse(body=csv_data)
        response.set_header('Content-Type', 'text/plain')

        return(response)


    """downloads pdf version of the invoice """
    @RPC(roles="finance_read")
    def get_pdf(self,_id):

        invoice=self.get(_id)

        if not 'sent' in invoice or invoice['sent']==False:
            raise FieldError("Invoice is not sent yet")

        import locale
        locale.setlocale(locale.LC_ALL, 'nl_NL.UTF-8')

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

        #title
        pdf_elements.append(Preformatted(invoice['title'],style=styles['Title']))

        pdf_elements.append(Spacer(0, 5*cm))

        #invoice number and date
        pdf_elements.append(Preformatted(invoice_format.format(**invoice), style=styles['Normal']))
        pdf_elements.append(Preformatted(time.strftime(date_format, time.localtime(invoice['sent_date'])), style=styles['Normal']))
                
        pdf_elements.append(Spacer(0, 3*cm))

        #convert invoice items to table
        table_data=[]

        #items heading
        meta=self.get_meta().meta['meta'].meta['meta']['items'].meta['meta'].meta['meta']
        table_data.append(
            [
                "",
                Paragraph(meta['desc'].meta['desc'], styles["Small"]),
                Paragraph(meta['price'].meta['desc'], styles["Small"]),
                Paragraph(meta['tax'].meta['desc'], styles["Small"]),
                Paragraph(meta['calc_total'].meta['desc'], styles["Small"]),
                Paragraph(meta['calc_tax'].meta['desc'], styles["Small"]),
                Paragraph(meta['calc_total_tax'].meta['desc'], styles["Small"]),
            ])

        #items
        for item in invoice['items']:
            table_data.append([
                    item['amount'],
                    Paragraph(item['desc'], styles["Small"]),
                    "{} {}".format(invoice['currency'], locale.format("%.2f", item['price'], monetary=True, grouping=False)),
                    "{}%".format(item['tax']),
                    "{} {}".format(invoice['currency'], locale.format("%.2f", item['calc_total'], monetary=True, grouping=False)),
                    "{} {}".format(invoice['currency'], locale.format("%.2f", item['calc_tax'], monetary=True, grouping=False)),
                    "{} {}".format(invoice['currency'], locale.format("%.2f", item['calc_total_tax'], monetary=True, grouping=False))
                ])

        #totals
        table_data.append([
            "",
            "",
            "",
            "Grand totals:",
            "{} {}".format(invoice['currency'], locale.format("%.2f", invoice['calc_total'], monetary=True, grouping=False)),
            "{} {}".format(invoice['currency'], locale.format("%.2f", invoice['calc_tax'], monetary=True, grouping=False)),
            "{} {}".format(invoice['currency'], locale.format("%.2f", invoice['calc_total_tax'], monetary=True, grouping=False)),
            ])

        #generate table and set cell styles
        table=Table(table_data, colWidths=[1*cm, 9*cm, 2*cm, 1*cm, 2*cm, 2*cm, 2*cm])
        table.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 8), #fontsize of the numbers
                ('GRID', (0,0), (-1,-2), 0.5, colors.gray), #global grid (last line no grid)
                ('LINEBELOW', (0,0), (-1,0), 2, colors.black), #header line
                ('ALIGN', (-5,0), (-1,-1), 'RIGHT'), #right align last 4 colums
                ('ALIGN', (0,0), (0,-1), 'RIGHT'), #right align amount
                ('VALIGN', (0,0), (-1,-1), 'TOP'), #align all rows to top
                ('GRID', (-3,-1), (-1,-1), 0.5, colors.gray), #totals grid
                ('LINEABOVE', (-3,-1), (-1,-1), 2, colors.black), #totals line
                ('GRID', (-1,-1), (-1,-1), 2, colors.black), #grand total inc. box

            ]))
        pdf_elements.append(table)


        #notes
        pdf_elements.append(Spacer(0, 1*cm))
        notes=Preformatted(invoice['notes'],style=styles['Italic'], splitChars=" ", maxLineLength=100)
        pdf_elements.append(notes)

        #print adress info and extra stuff on first page
        def first_page(canvas, pdf):
            canvas.saveState()

            #senders adress and company info
            from_frame=Frame(15*cm, 19.5*cm, 12*cm, 8*cm, showBoundary=0)
            from_frame.addFromList([
                Preformatted(from_format.format(**invoice['from_copy']),style=styles['Small'])
            ], canvas)


            #customer adress and info
            to_frame=Frame(2*cm, 19.5*cm, 10*cm, 6*cm, showBoundary=0)
            to_frame.addFromList([
                Preformatted(retour_format.format(**invoice['from_copy']),style=styles['Small']),
                Preformatted(to_format.format(**invoice['to_copy']),style=styles['Normal'])
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
        file_name=invoice["to_copy"]["company"]+" "+invoice["title"]+" "+invoice["invoice_nr"]+".pdf"
        response.set_header('Content-Type', 'application/octet-stream')
        response.set_header('Content-Disposition', "attachment;filename="+file_name  );

        return(response)



