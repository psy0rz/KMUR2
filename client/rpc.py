import json
import urllib.request
import http.cookiejar
import sys

class RpcClient:
	"""tracer rpc client class. """
	def __init__(self, url, abort_on_error=True):
		cj = http.cookiejar.CookieJar()
		self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
		self.url=url
		self.abort_on_error=abort_on_error

	"""request the specified rpc command, and remember the login session

		command: dotted notation, for example: "core.Users.login"
		params: Dict with parameters. (should be convertable to JSON)
	"""
	def request(self, command, help=False, **params):
		(module,cls,method)=command.split(".")
		rpc_data={
			"help": help,
			"module":module,
			"class": cls,
			"method": method,
			"params": params
		}

		#create the request
		req = urllib.request.Request(
			url=self.url, 
			method='POST',
			data=json.dumps(rpc_data).encode('utf-8'))
		req.add_header("Content-Type","application/json")

		#call actual rpc
		with self.opener.open(req) as f:
			result=json.loads(f.read().decode('utf-8'))

			#abort on error
			if self.abort_on_error and 'error' in result:
				print(result)
				sys.exit(1)

			return(result)
