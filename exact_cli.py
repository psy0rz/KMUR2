from exact import ensure_token, do_oauth_flow

if ensure_token() is None:
    do_oauth_flow()
else:
    print("Valid token found, no oauth flow needed.")

