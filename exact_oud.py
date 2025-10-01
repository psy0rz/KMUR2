from pprint import pprint
import re

from exact_base import exact_get, exact_post, exact_delete
from files.exact_secrets import DIVISION


def get_current_me():
    return exact_get("current/Me", division=None)[0]


def get_divisions():
    return exact_get("system/Divisions")



def get_accounts():
    return exact_get('crm/Accounts')


def get_sales_invoices():
    return   exact_get("salesentry/SalesEntries")

def sales_line(gl_account, amount_ex_vat, description, vat_percentage):
    data={
         'AmountFC': amount_ex_vat, #ex  btw
        'Description': description,
        'GLAccount': gl_account['ID'], #code 8000
        # 'VATAmountDC': 31.5, #automatisch
        # 'VATAmountFC': 31.5,
        # 'VATBaseAmountDC': 150,
        # 'VATBaseAmountFC': 150,
        # 'VATCode': '4  ',
        # 'VATCodeDescription': 'BTW hoog inclusief',
        'VATPercentage': vat_percentage,
    }
    # pprint(data)
    # return exact_post("salesentry/SalesEntryLines", data)
    return data


def create_sales_invoice(account, invoice_nr_str , sales_lines):
    # Strip non-numeric characters and convert to int
    invoice_nr_clean = int(re.sub(r'\D', '', str(invoice_nr_str)))
    data = {
        'Journal': '70',
        'Customer': account['ID'],
        # 'EntryNumber': invoice_nr_clean,
        'Description': invoice_nr_str,
        # 'InvoiceNumber': invoice_nr_clean,
        'SalesEntryLines': sales_lines

    }


    return exact_post("salesentry/SalesEntries", data)

def get_gl_account_by_code(code):
    url = f"financial/GLAccounts"
    accounts = exact_get(url, params=f"$filter=Code eq '{code}'")
    if len(accounts) == 0:
        return None

    if len(accounts) > 1:
        raise Exception(f"Multiple GL accounts found with code {code}")

    return accounts[0]


def create_account(code, name, country):
    data = {
        "Code": str(code).rjust(18),
        'ConsolidationScenario': 4,
        'Country': country,
        'Division': DIVISION,
        'Status': 'C',
        'InvoiceAttachmentType': 1,
        "Name": name,
    }
    return exact_post("crm/Accounts", data)

def get_account_by_code(code):
    """klant"""
    code = f"{code:>18}"
    url = f"crm/Accounts"
    accounts = exact_get(url, params=f"$filter=Code eq '{code}'")
    if len(accounts) == 0:
        return None

    if len(accounts) > 1:
        raise Exception(f"Multiple accounts found with code {code}")

    return accounts[0]

# pprint (create_account(214, 'Test' ,'NL'))
# pprint(get_account_by_code(214)['Name'])
#
# a=exact_get('crm/Accounts', params="$filter=Name eq 'Test'")
#
# for ac in a:
#     print(f"#{ac['Code']}# {ac['Name']} {ac['ID']}")
#     exact_delete("crm/Accounts", ac['ID'])
#
# print(len(a))

# pprint(get_sales_invoices()[0])
# pprint(get_sales_invoices()[0]['EntryID'])


# pprint(exact_get("salesentry/SalesEntries(guid'3ee8cab7-5d50-4f92-8b67-001d3e9444a0')/SalesEntryLines"))



# pprint(get_current_me())

# try:
#     pprint(create_sales_line(get_gl_account_by_code(8000), 123, 'test', 0.21))
# except Exception as e:
#     print("Error:", e)
#
### maak factuur procedure
# try:
#     account=get_account_by_code(214)
#     if account is None:
#         account=create_account(214, 'Test', 'NL')
#
#     gl_account=get_gl_account_by_code('8000')
#
#     invoice=create_sales_invoice(account, '2025-0100', [
#         # sales_line(gl_account, 100, 'test regel 1 met 21%', 0.21),
#         # sales_line(gl_account, 100, 'test regel 2 met 9%', 0.09),
#     ])
# except Exception as e:
#     print("Error:", e)
#     raise e
#     exit(1)


