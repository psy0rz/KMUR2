#!/usr/bin/env python

import beaker.middleware
import bottle
import re
import traceback
import models.common 
import models.field
import json




# curl -b /tmp/cookies -c /tmp/cookies --data-binary '{ "module":"core","class":"Users", "method":"test", "params":1 }' -H "Content-Type: application/json"  http://localhost:8080/rpc

#rpc calls to models:
@bottle.post('/rpc')
def rpc():
	session = bottle.request.environ.get('beaker.session')

	#return object will be stored here:
	ret={}

	try:
		#print bottle.request.json
		data=bottle.request.json

		if not "module" in data:
			raise Exception("Module not specified")
		
		if re.search("[^a-zA-Z0-9_]", data['module']):
			raise Exception("Illegal module name")
		
		if not "class" in data:
			raise Exception("Class not specified")
		
		if re.search("[^a-zA-Z0-9]", data['class']):
			raise Exception("Illegal class name")
		
		if not "method" in data:
			raise Exception("Method not specified")
		
		if re.search("[^a-zA-Z0-9_]", data['method']):
			raise Exception("Illegal method name")
		
		if re.search("^_", data['method']):
			raise Exception("Methodname may not begin with _")

		if not "params" in data:
			raise Exception("Params not specified")

		#load module and resolve class
		rpc_models=__import__('models.'+data['module']+'.'+data['class'])
		rpc_module=getattr( rpc_models, data['module'])
		rpc_package=getattr(rpc_module, data['class'])
		rpc_class=getattr(rpc_package, data['class'])

		#create context if its non existant for this session
		if not 'context' in session:
			session['context']=models.common.Context()
		
		#instantiate class
		rpc_class_instance=rpc_class(session['context'])
		if not isinstance(rpc_class_instance, models.common.Base):
			raise Exception("Class is not a model")

		#resolve method
		rpc_method=getattr(rpc_class_instance, data['method'])

		#make sure that it has an acl
		if not hasattr(rpc_method, 'has_acl_decorator'):
			raise Exception("This method cannot be called because it has no @Acl decorator")
		
		#call method with specified parameters
		ret['result']=rpc_method(data['params'])

		
	except Exception as e:
		traceback.print_exc()
		ret['error']=str(e)
		
	#import: clear context cache before saving!
	if 'context' in session and isinstance(session['context'], models.common.Context):
		session['context'].clear()
	
	session.save()

	#return JSON string;
	return(json.dumps(ret, cls=models.field.JSONEncoder, indent=1))

#serve other urls from the static dir
#(in production the webserver should do this)
@bottle.route('/<filename:path>')
def send_static(filename):
    return bottle.static_file(filename, root='static')

#map default url to index.html
@bottle.route('/')
def send_default():
    return bottle.static_file("index.html", root='static')


session_opts = {
    'session.type': 'file',
    'session.cookie_expires': True,
    'session.data_dir': '/tmp/testsessions'
}


app = beaker.middleware.SessionMiddleware(
		bottle.default_app()
	,session_opts)


#debug mode
bottle.debug(True)
bottle.run(reloader=True, app=app, host='localhost', port=8080)

#production:
#bottle.run(app=app, host='localhost', port=8080)

