import json
import os
from pprint import pprint

import requests
from requests_oauthlib import OAuth2Session

from files.exact_secrets import CLIENT_ID, CLIENT_SECRET, DIVISION

REDIRECT_URI = 'https://tracer.datux.nl/api/exact'
AUTHORIZATION_BASE_URL = 'https://start.exactonline.nl/api/oauth2/auth'
TOKEN_URL = 'https://start.exactonline.nl/api/oauth2/token'
API_URL = 'https://start.exactonline.nl/api/v1'
TOKEN_FILE = 'files/exact_tokens.json'


# Save tokens to file
def save_tokens(token):
    global TOKEN
    TOKEN = token
    with open(TOKEN_FILE, 'w') as f:
        json.dump(token, f)

# Load tokens from file
def load_tokens():
    global TOKEN
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            TOKEN=json.load(f)
            return TOKEN
    return None

# Refresh tokens using the refresh token
def refresh_tokens(token):
    extra = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    oath = OAuth2Session(CLIENT_ID, token=token)
    try:
        new_token = oath.refresh_token(TOKEN_URL, refresh_token=token['refresh_token'], **extra)
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
def fetch_access_token(oauth, authorization_response):
    token = oauth.fetch_token(
        TOKEN_URL,
        authorization_response=authorization_response,
        client_secret=CLIENT_SECRET
    )
    return token

def exact_get( call, params=None, division=DIVISION):
    """
    Generic GET request for Exact Online API.
    Handles authorization, error reporting, and returns the actual data (list or dict),
    automatically removing OData 'd' and 'results' wrappers if present.
    """
    global TOKEN
    headers = {
        'Authorization': f"Bearer {TOKEN['access_token']}",
        'Accept': 'application/json'
    }

    if division is not None:
        url = f'{API_URL}/{division}/{call}'
    else:
        url = f'{API_URL}/{call}'

    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        # Remove OData wrappers if present
        if isinstance(data, dict) and 'd' in data:
            d = data['d']
            if isinstance(d, dict) and 'results' in d:
                return d['results']
            else:
                return d
        return data
    else:
        raise Exception(f"GET {url} failed: {response.status_code} - {response.text}")

def exact_post(call, payload, division=DIVISION):
    """
    Generic POST request for Exact Online API.
    Handles authorization, error reporting, and returns the actual data (dict),
    automatically removing OData 'd' and 'results' wrappers if present.
    """
    global TOKEN
    headers = {
        'Authorization': f"Bearer {TOKEN['access_token']}",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    if division is not None:
        url = f'{API_URL}/{division}/{call}'
    else:
        url = f'{API_URL}/{call}'
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(response.status_code)
    if response.status_code in (200, 201):
        data = response.json()
        # pprint(data)
        # Remove OData wrappers if present
        if isinstance(data, dict) and 'd' in data:
            d = data['d']
            if isinstance(d, dict) and 'results' in d:
                return d['results']
            else:
                return d
        return data
    else:
        raise Exception(f"POST {url} failed: {response.status_code} - {response.text}")

def exact_delete(call, id, division=DIVISION):
    """
    Generic DELETE request for Exact Online API.
    Handles authorization and error reporting.
    Returns True if successful, raises Exception otherwise.
    """

    if id=='':
        raise Exception("ID for deletion cannot be empty")

    if type(id) is not str:
        raise Exception(f"ID for deletion must be a string: {id}")

    global TOKEN
    headers = {
        'Authorization': f"Bearer {TOKEN['access_token']}",
        'Accept': 'application/json'
    }
    if division is not None:
        url = f"{API_URL}/{division}/{call}(guid'{id}')"
    else:
        url = f"{API_URL}/{call}(guid'{id}')"
    response = requests.delete(url, headers=headers)
    if response.status_code in (200, 204):
        return True
    else:
        raise Exception(f"DELETE {url} failed: {response.status_code} - {response.text}")




def do_oauth_flow():
    # No valid token, do full OAuth2 flow
    exact = get_authorization_url()
    print("\nStep 2: After authorizing, paste the full redirect URL here:")
    authorization_response = input("Paste the full redirect URL: ")
    print("\nStep 3: Fetching access token...")
    token = fetch_access_token(exact, authorization_response)
    save_tokens(token)



def ensure_token():
    print("Checking exact token...")
    token = load_tokens()
    if token:
        # Try a lightweight API call to check if token is valid
        headers = {
            'Authorization': f"Bearer {token['access_token']}",
            'Accept': 'application/json'
        }
        test_resp = requests.get(f'{API_URL}/current/Me', headers=headers)
        if test_resp.status_code == 200:
            print("Token valid.")
            return token
        else:
            print("Access token may be expired. Attempting to refresh...")
            token = refresh_tokens(token)
            if token:
                # Test refreshed token
                headers['Authorization'] = f"Bearer {token['access_token']}"
                test_resp = requests.get(f'{API_URL}/v1/current/Me', headers=headers)
                if test_resp.status_code == 200:
                    print("Token valid.")
                    return token
                else:
                    print("Failed to use refreshed token. Reauthorization required.")
            else:
                print("Failed to refresh token. Reauthorization required.")

    print("No valid token found. Please run the OAuth flow.")
    return None

ensure_token()
