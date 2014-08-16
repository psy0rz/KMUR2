import json
import requests
import sys

class RpcClient:
	"""tracer rpc client class. """
	def __init__(self, url, abort_on_error=True):
		self.session=requests.Session()
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

		result=self.session.post(
			self.url, 
			data=json.dumps(rpc_data).encode('utf-8'),
			headers={ 'content-type': 'application/json' }
		).json()

		#abort on error
		if self.abort_on_error and 'error' in result:
			print(json.dumps(result, indent='\t'))
			sys.exit(1)

		return(result)


