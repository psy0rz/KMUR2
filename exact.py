from pprint import pprint

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

def create_sales_invoice(account):
    #Journal:'70'
    data={
        'Journal': '70',
        'Customer': account['ID'],
        'SalesEntryLines': []
    }


def get_gl_account_by_code(code):
    url = f"financial/GLAccounts"
    accounts = exact_get(url, params=f"$filter=Code eq '{code}'")
    if len(accounts) == 0:
        return None

    if len(accounts) > 1:
        raise Exception(f"Multiple GL accounts found with code {code}")

    return accounts[0]

def create_sales_line(gl_account):
    data={
        'AmountDC': 150,
         'AmountFC': 150,
        'Description': '2016-0167',
        'GLAccount': gl_account, #code 8000
        'VATAmountDC': 31.5,
        'VATAmountFC': 31.5,
        'VATBaseAmountDC': 150,
        'VATBaseAmountFC': 150,
        'VATCode': '4  ',
        'VATCodeDescription': 'BTW hoog inclusief',
        'VATPercentage': 0.21,
    }

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


pprint(exact_get("salesentry/SalesEntries(guid'3ee8cab7-5d50-4f92-8b67-001d3e9444a0')/SalesEntryLines"))


### maak factuur procedure
# account=get_account_by_code(214)
# if account is None:
#     account=create_account(214, 'Test', 'NL')
#
# gl_account=get_gl_account_by_code('8000')['ID']



