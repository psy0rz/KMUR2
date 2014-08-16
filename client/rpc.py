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
		filename: name of a file to upload. this changes request to a multipart/form.
		params: Dict with parameters. (should be convertable to JSON)
	"""
	def request(self, command, filename=None, help=False, **params):
		(module,cls,method)=command.split(".")
		rpc_data={
			"help": help,
			"module":module,
			"class": cls,
			"method": method,
			"params": params
		}

		data=json.dumps(rpc_data).encode('utf-8')

		if filename:
			#send as multipart form
			import requests_toolbelt

			encoder = requests_toolbelt.MultipartEncoder(
			    fields=
			    { 'rpc': data,
			    		 'file': ( filename, open(filename, 'rb'))
			    		 #'file': open(filename, 'rb')
			    }
			)

			result=self.session.post(
				self.url, 
				data=encoder,
				headers={ 'Content-Type': encoder.content_type}
			)

		else:
			result=self.session.post(
				self.url, 
				data=data,
				headers={ 'Content-Type': 'application/json' }
			)

		try:
			ret=result.json()
		except:
			raise Exception(result.text)

		#abort on error
		if self.abort_on_error and 'error' in ret:
			raise Exception(json.dumps(ret, indent='\t'))

		return(ret)


