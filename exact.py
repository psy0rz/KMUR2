import datetime
import re
from pprint import pprint

from exactonline.api import ExactApi
from exactonline.exceptions import ObjectDoesNotExist
from exactonline.storage.ini import IniStorage


# Create a function to get the api with your own storage backend.
def get_api():
    # NOTE: The IniStorage is really simple does not synchronize with
    # other instances. You should create your own storage. See below.
    storage = IniStorage('files/exact.ini')
    return ExactApi(storage=storage)




def get_relation_guid(doc):
    """get or create relation from doc dict

    doc={'address': 'Monte Christolaan 123',
             'bic_code': '',
             'city': 'Veenendaal',
             'coc_nr': '',
             'company': 'Bla BV',
             'country': 'Nederland',
             'customer_nr': '123',
             'department': '',
             'iban_nr': '',
             'mail_to': 'bla@bla.nl',
             'print': False,
             'province': '',
             'tax': 21,
             'vat_nr': '',
             'zip_code': '1234 AJ'}
    """



    #test
    # relation=api.relations.get(relation_code='214')
    #api.relations.delete(relation['ID'])

    api = get_api()

    try:
        relation = api.relations.get(relation_code=doc['customer_nr'])
        print(f"exact: Found relation {doc['customer_nr']}")
    except ObjectDoesNotExist:
        print(f"exact: Creating relation {doc['customer_nr']}")
        pprint(doc)
        relation_data = {
            "Code": str(doc['customer_nr']).rjust(18),
            'ConsolidationScenario': 4,
            'Country': doc['country'],
            'Status': 'C',
            'InvoiceAttachmentType': 1,
            "Name": doc['company'],
        }
        api.relations.create(relation_data)
        print("Created relation")

        relation = api.relations.get(relation_code=doc['customer_nr'])

    pprint(relation)


    return relation['ID']


def get_gl_vat():
    """return glid's and vat codes per vat percentage"""
    api = get_api()

    ret={}

    # 8000 - Omzet hoog
    # BTW-code 4
    # 0.21
    gl_id=api.ledgeraccounts.filter(filter="Code eq '8000'")[0]['ID']
    vat_code='4  '
    ret[21]={'gl_id':gl_id, 'vat_code':vat_code}

    # 8200 - Omzet onbelast
    # BTW-code 20
    # 0.00
    #XXX

    # 8400 - Omzet binnen EU
    # BTW-code 7
    # 0.00
    gl_id=api.ledgeraccounts.filter(filter="Code eq '8400'")[0]['ID']
    vat_code='7  '
    ret[0]={'gl_id':gl_id, 'vat_code':vat_code}

    return ret


def make_sales_lines(doc):
    vat_lookup=get_gl_vat()
    sales_lines = []

    # 'items': [{'amount': 12,
    # 'calc_tax': 252.0,
    # 'calc_total': 1200,
    # 'calc_total_tax': 1452.0,
    # 'desc': 'test',
    # 'price': 100,
    # 'tax': 21}]

    for item in doc['items']:
        if item['tax'] not in vat_lookup:
            raise Exception(f"VAT percentage {item['tax']} not found in Exact lookup table")

        vat = vat_lookup[item['tax']]

        sales_lines.append({
            # 'AmountDC': str(amount_with_vat-total_vat),
            'AmountFC': item['calc_total_tax'],
            'Quantity': 1,
            'Description': item['desc'],
            'GLAccount': vat['gl_id'],
            'VATCode': vat['vat_code']

        })


    return sales_lines

#called by KMUR when invoice is added
def add_exact(doc):

    customer_guid=get_relation_guid(doc['to_copy'])
    remote_journal='70' # 70 "Verkoopboek"
    invoice_date_unix = doc['sent_date']  # assuming this is a Unix timestamp (int or float)
    invoice_date = datetime.datetime.utcfromtimestamp(invoice_date_unix)
    edm_datetime = invoice_date.strftime('%Y-%m-%dT%H:%M:%SZ')


    local_invoice_number=doc['invoice_nr']
    invoice_nr_clean = int(re.sub(r'\D', '', str(local_invoice_number)))

    sales_lines=make_sales_lines(doc)


    invoice_data = {
        'EntryDate': edm_datetime,
        'Customer': customer_guid,
        'Description': local_invoice_number,
        'Journal': remote_journal,
        'ReportingPeriod': invoice_date.month,
        'ReportingYear': invoice_date.year,
        'SalesEntryLines': sales_lines,
        'YourRef': local_invoice_number,
        'InvoiceNumber': invoice_nr_clean,
        'EntryNumber': invoice_nr_clean,
        'PaymentCondition': '14'
    }


    pprint(invoice_data)
    api = get_api()
    api.invoices.create(invoice_data)




#called by KMUR when invoice is deleted
def del_exact(doc):

    api = get_api()
    invoice=api.invoices.get(invoice_number=doc['invoice_nr'])


    api.invoices.delete(invoice['EntryID'])


