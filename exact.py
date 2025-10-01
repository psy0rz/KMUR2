import re
from pprint import pprint
import datetime

from exactonline.api import ExactApi
from exactonline.exceptions import ObjectDoesNotExist
from exactonline.http import binquote
from exactonline.resource import GET, POST, PUT, DELETE
from exactonline.storage.ini import IniStorage

# Create a function to get the api with your own storage backend.
def get_api():
    # NOTE: The IniStorage is really simple does not synchronize with
    # other instances. You should create your own storage. See below.
    storage = IniStorage('files/exact.ini')
    return ExactApi(storage=storage)
api = get_api()




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



def add_exact(doc):

    customer_guid=get_relation_guid(doc['to_copy'])

    return
    remote_journal='70'
    gl_id=api.ledgeraccounts.filter(filter="Code eq '8000'")[0]['ID']
    vat_code='4  '

    # pprint(api.vatcodes.all())

    # 8000 - Omzet hoog
    # BTW-code 4
    # 0.21

    # 8200 - Omzet onbelast
    # BTW-code 20
    # 0.00

    # 8400 - Omzet binnen EU
    # BTW-code 7
    # 0.00



    # filter=binquote("'AmountFC' eq 'Test line 1'")
    # pprint(api.restv1(GET(f"salesentry/SalesEntryLines?$top=10")))

    # exit(1)

    invoice_date = datetime.datetime.now()
    local_invoice_number='2025-9999'
    invoice_nr_clean = int(re.sub(r'\D', '', str(local_invoice_number)))


    for invoice in api.invoices.filter(filter=f"EntryNumber eq {invoice_nr_clean}"):
        pprint(invoice)
        api.invoices.delete(invoice['EntryID'])
    # #
    # #     pprint(api.rest())
    #
    #
    # pprint(api.restv1(GET("salesentry/SalesEntryLines(guid'14866ce5-2ab3-44e0-a686-c62f3df617f5')")))


    exit (1)

    invoice_data = {
        'EntryDate': invoice_date.strftime('%Y-%m-%dT%H:%M:%SZ'),  # pretend we're in UTC
        'Customer': customer_guid,
        'Description': local_invoice_number,
        'Journal': remote_journal,  # 70 "Verkoopboek"
        'ReportingPeriod': invoice_date.month,
        'ReportingYear': invoice_date.year,
        'SalesEntryLines': [
            {
                # 'AmountDC': str(amount_with_vat-total_vat),
                'AmountFC': 121,
                'Quantity': 1,
                'Description': 'Test line 1',
                'GLAccount': gl_id,
                'VATCode': vat_code

            }


        ],
        'YourRef': local_invoice_number,
        'InvoiceNumber': invoice_nr_clean,
        'EntryNumber': invoice_nr_clean,
        'PaymentCondition': '14'
    }

    # pprint(invoice_data)
    api.invoices.create(invoice_data)

    # for invoice in api.invoices.filter(filter=f"YourRef eq '{local_invoice_number}'"):
    #     pprint(invoice)
    #     api.invoices.delete(invoice['EntryID'])
    exit(1)


    # import exactonline.elements
    #
    # exactonline.elements.ExactCustomer
    #
    # class MienInvoice(exactonline.elements.ExactInvoice):
    #
    #     def get_customer(self):
    #
    # invoice=exactonline.elements.ExactInvoice(api)








