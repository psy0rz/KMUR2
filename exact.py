from pprint import pprint

from exact_base import exact_get

def get_current_me():
    return exact_get("current/Me", division=None)[0]


def get_divisions():
    return exact_get("system/Divisions")



def get_accounts():
    return exact_get('crm/Accounts')


def get_sales_invoices():
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntries?$filter=InvoiceNumber eq 20240155"
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntries"
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntryLines"
    # url_base="https://start.exactonline.nl/api/v1/217519/salesentry/SalesEntryLines(guid'f36c8a00-b3f7-4dfb-a399-051b81c2e2a7')"
    return   exact_get("salesentry/SalesEntries")

def get_account_by_code(code):
    code = code.rjust(18)
    url = f"crm/Accounts"
    accounts=exact_get(url, params=f"$filter=Code eq '{code}'")
    if (len(accounts) == 0):
        raise Exception(f"Account with code {code} not found")

    return accounts[0]

