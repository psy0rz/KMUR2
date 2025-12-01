import exact

api = exact.get_api()

url=api.create_auth_request_url()
print(f"Go to the following URL to authorize the application:\n{url}\n")

code = input("Enter the authorization code: ")
api.request_token(code)

