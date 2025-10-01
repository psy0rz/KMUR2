import exact

url=exact.api.create_auth_request_url()
print(f"Go to the following URL to authorize the application:\n{url}\n")

code = input("Enter the authorization code: ")
exact.api.request_token(code)

