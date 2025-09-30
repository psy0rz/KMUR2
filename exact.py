from pprint import pprint

from exact_base import exact_get

def get_current_me():
    return exact_get("current/Me", division=None)[0]


def get_divisions():
    return exact_get("system/Divisions")



def get_accounts():
    results = exact_get('crm/Accounts')
    if results:
        print(len(results), "accounts found:")
        for account in results:
            print(f"Account: {account['Name']}")
        return results
    return None


def get_sales_invoices():
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntries?$filter=InvoiceNumber eq 20240155"
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntries"
    # url_base=f"https://start.exactonline.nl/api/v1/{DIVISION}/salesentry/SalesEntryLines"
    # url_base="https://start.exactonline.nl/api/v1/217519/salesentry/SalesEntryLines(guid'f36c8a00-b3f7-4dfb-a399-051b81c2e2a7')"
    return   exact_get("salesentry/SalesEntries")



# pprint(get_current_me())
# pprint(get_sales_invoices())