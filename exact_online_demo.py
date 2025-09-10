import sys
from pprint import pprint

import requests
from requests_oauthlib import OAuth2Session
import json
import os

from exact_secrets import CLIENT_ID, CLIENT_SECRET, DIVISION

REDIRECT_URI = 'https://tracer.datux.nl/api/exact'
AUTHORIZATION_BASE_URL = 'https://start.exactonline.nl/api/oauth2/auth'
TOKEN_URL = 'https://start.exactonline.nl/api/oauth2/token'
TOKEN_FILE = 'exact_tokens.json'


# Save tokens to file
def save_tokens(token):
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token, f)

# Load tokens from file
def load_tokens():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return None

# Refresh tokens using the refresh token
def refresh_tokens(token):
    extra = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    exact = OAuth2Session(CLIENT_ID, token=token)
    try:
        new_token = exact.refresh_token(TOKEN_URL, refresh_token=token['refresh_token'], **extra)
        save_tokens(new_token)
        return new_token
    except Exception as e:
        print(f"Failed to refresh token: {e}")
        return None

# Step 1: Redirect user to Exact Online for authorization
def get_authorization_url():
    exact = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI)
    authorization_url, state = exact.authorization_url(AUTHORIZATION_BASE_URL)
    print(f"Visit this URL to authorize the application: {authorization_url}")
    return exact

# Step 2: Exchange the authorization code for an access token
def fetch_access_token(exact, authorization_response):
    token = exact.fetch_token(
        TOKEN_URL,
        authorization_response=authorization_response,
        client_secret=CLIENT_SECRET
    )
    return token

# Step 3: Use the access token to call the API
def get_current_me(token):
    headers = {
        'Authorization': f"Bearer {token['access_token']}",
        'Accept': 'application/json'
    }
    response = requests.get('https://start.exactonline.nl/api/v1/current/Me', headers=headers)
    if response.status_code == 200:
        ret=response.json()['d']['results'][0]

        pprint(ret)
        return ret
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

def exact_get(token, url, params=None):
    """
    Generic GET request for Exact Online API.
    Handles authorization, error reporting, and returns the actual data (list or dict),
    automatically removing OData 'd' and 'results' wrappers if present.
    """
    headers = {
        'Authorization': f"Bearer {token['access_token']}",
        'Accept': 'application/json'
    }
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            try:
                data = response.json()
                # Remove OData wrappers if present
                if isinstance(data, dict) and 'd' in data:
                    d = data['d']
                    if isinstance(d, dict) and 'results' in d:
                        return d['results']
                    else:
                        return d
                return data
            except Exception as e:
                print(f"Error parsing JSON: {e}")
                print("Raw response:", response.text)
                return None
        else:
            print(f"GET {url} failed: {response.status_code}")
            print("Response headers:", response.headers)
            print("Response body:", response.text)
            return None
    except Exception as e:
        print(f"Request error: {e}")
        return None

# Refactor all functions to use the global DIVISION variable instead of passing division as a parameter

def get_accounts(token):
    url = f'https://start.exactonline.nl/api/v1/{DIVISION}/crm/Accounts'
    results = exact_get(token, url)
    if results:
        print(len(results), "accounts found:")
        for account in results:
            print(f"Account: {account['Name']}")
        return results
    return None

def get_sales_invoices(token, max_results=200):
    url_base = f"https://start.exactonline.nl/api/v1/{DIVISION}/sync/SalesInvoice/SalesInvoices?top=1"
    results = exact_get(token, url_base)
    if results:
        print(f"Fetched {len(results)} sales invoices:")
        for inv in results:
            print(f"Invoice: {inv.get('InvoiceNumber')} | Customer: {inv.get('CustomerName')} | Date: {inv.get('InvoiceDate')} | Amount: {inv.get('AmountDC')}")
        return results
    return None

def get_items(token):
    url = f'https://start.exactonline.nl/api/v1/{DIVISION}/logistics/Items'
    results = exact_get(token, url)
    if results:
        print(f"{len(results)} items found:")
        for item in results:
            print(f"Item: {item['Description']} | GUID: {item['ID']}")
        return results
    return None

def create_invoice_with_lines(token, invoice_data):
    url = f'https://start.exactonline.nl/api/v1/{DIVISION}/salesinvoice/SalesInvoices'
    headers = {
        'Authorization': f"Bearer {token['access_token']}",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    response = requests.post(url, headers=headers, data=json.dumps(invoice_data))
    if response.status_code in (200, 201):
        print("Invoice created successfully!")
        pprint(response.json())
        return response.json()
    else:
        print(f"Error creating invoice: {response.status_code}")
        print("Response headers:", response.headers)
        print("Response body:", response.text)
        return None

def create_item(token, item_data):
    url = f'https://start.exactonline.nl/api/v1/{DIVISION}/logistics/Items'
    headers = {
        'Authorization': f"Bearer {token['access_token']}",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    response = requests.post(url, headers=headers, data=json.dumps(item_data))
    if response.status_code in (200, 201):
        print("Item created successfully!")
        pprint(response.json())
        return response.json()
    else:
        print(f"Error creating item: {response.status_code}")
        print("Response headers:", response.headers)
        print("Response body:", response.text)
        return None

def ensure_token():
    token = load_tokens()
    if token:
        # Try a lightweight API call to check if token is valid
        headers = {
            'Authorization': f"Bearer {token['access_token']}",
            'Accept': 'application/json'
        }
        test_resp = requests.get('https://start.exactonline.nl/api/v1/current/Me', headers=headers)
        if test_resp.status_code == 200:
            return token
        else:
            print("Access token may be expired. Attempting to refresh...")
            token = refresh_tokens(token)
            if token:
                # Test refreshed token
                headers['Authorization'] = f"Bearer {token['access_token']}"
                test_resp = requests.get('https://start.exactonline.nl/api/v1/current/Me', headers=headers)
                if test_resp.status_code == 200:
                    return token
                else:
                    print("Failed to use refreshed token. Reauthorization required.")
            else:
                print("Failed to refresh token. Reauthorization required.")
    # No valid token, do full OAuth2 flow
    exact = get_authorization_url()
    print("\nStep 2: After authorizing, paste the full redirect URL here:")
    authorization_response = input("Paste the full redirect URL: ")
    print("\nStep 3: Fetching access token...")
    token = fetch_access_token(exact, authorization_response)
    save_tokens(token)
    return token

# Example API action: create a new invoice with lines
def do_api_action(token):
    # get_sales_invoices(token)
    get_accounts(token)
    # print("\nCreating a new item...")
    # item_data = {
    #     "Code": "DEMOITEM001",
    #     "Description": "Demo Item Created via API",
    #     "IsSalesItem": True,
    #     "IsStockItem": False
    # }
    # create_item(token, item_data)
    # # Optionally, list items after creation
    # print("\nFetching items...")
    # items = get_items(token)
    # print(items)

if __name__ == "__main__":
    print("Exact Online OAuth2 Demo\n")
    token = ensure_token()

    if sys.argv[1:] and sys.argv[1] == 'refresh':
        print("Refreshed token, exiting")
        sys.exit(0)

    # do_api_action(token)
    print("\nDone.")
