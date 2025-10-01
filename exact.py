import re
from pprint import pprint
import datetime

from exactonline.api import ExactApi
from exactonline.exceptions import ObjectDoesNotExist
from exactonline.resource import GET, POST, PUT, DELETE
from exactonline.storage.ini import IniStorage

# Create a function to get the api with your own storage backend.
def get_api():
    # NOTE: The IniStorage is really simple does not synchronize with
    # other instances. You should create your own storage. See below.
    storage = IniStorage('files/exact.ini')
    return ExactApi(storage=storage)
api = get_api()


# pprint(api.rest(GET('v1/current/Me')))
#
# sys.exit(1)


#kmur ding ophalen
#pprint(api.invoices.filter(filter ='InvoiceNumber eq 20160167'))


vat=0.21
amount_with_vat=100
total_vat=amount_with_vat*vat
customer_guid=api.relations.get(relation_code='214')['ID']
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





invoice_date = datetime.datetime.now()
local_invoice_number='3000-0001'
invoice_nr_clean = int(re.sub(r'\D', '', str(local_invoice_number)))

invoice_data = {
    # 'AmountDC': str(amount_with_vat),  # DC = default currency
    # 'AmountFC': str(amount_with_vat),  # FC = foreign currency
    'EntryDate': invoice_date.strftime('%Y-%m-%dT%H:%M:%SZ'),  # pretend we're in UTC
    'Customer': customer_guid,
    'Description': u'Invoice description',
    'Journal': remote_journal,  # 70 "Verkoopboek"
    'ReportingPeriod': invoice_date.month,
    'ReportingYear': invoice_date.year,
    'SalesEntryLines': [
        {
            'AmountDC': str(amount_with_vat-total_vat),
            'AmountFC': str(amount_with_vat-total_vat),
            'Description': 'Test line 1',
            'GLAccount': gl_id,
            'VATCode': vat_code



        }


    ],
    # 'VATAmountDC': str(total_vat),
    # 'VATAmountFC': str(total_vat),
    'YourRef': local_invoice_number,
    'InvoiceNumber': invoice_nr_clean,
}
api.invoices.create(invoice_data)



# import exactonline.elements
#
# exactonline.elements.ExactCustomer
#
# class MienInvoice(exactonline.elements.ExactInvoice):
#
#     def get_customer(self):
#
# invoice=exactonline.elements.ExactInvoice(api)








