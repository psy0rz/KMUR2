#!/usr/bin/env python

import beaker.middleware
import bottle
import re
import traceback

#curl -d '{ "class": "geert" }' -H 'Content-Type: application/json' http://localhost:8080/rpc
#rpc calls to models:
@bottle.post('/rpc')
def rpc():
	s = bottle.request.environ.get('beaker.session')

	try:
		#print bottle.request.json
		data=bottle.request.json

		if not "module" in data:
			raise Exception("Module not specified")
		
		if re.search("[^a-zA-Z0-9_]", data['module']):
			raise Exception("Illegal module name")
		
		if not "class" in data:
			raise Exception("Class not specified")
		
		if re.search("[^a-zA-Z0-9_]", data['class']):
			raise Exception("Illegal class name")
		
		if not "method" in data:
			raise Exception("Method not specified")
		
		if re.search("[^a-zA-Z0-9_]", data['method']):
			raise Exception("Illegal method name")

		if not "params" in data:
			raise Exception("Params not specified")

#		import models.core.users
#		u=models.core.users.users()
#		u.test()
#
		#load module and resolve class
		rpc_models=__import__('models.'+data['module']+'.'+data['class'])
		rpc_module=getattr( rpc_models, data['module'])
		rpc_package=getattr(rpc_module, data['class'])
		rpc_class=getattr(rpc_package, data['class'])
		
		#instantiate class and resolve method
		rpc_class_instance=rpc_class()
		rpc_method=getattr(rpc_class_instance, data['method'])
		
		#make sure that it has an acl
		if not hasattr(rpc_method, 'has_acl_decorator'):
			raise Exception("This method cannot be called because it has no @acl decorator")
				
		return(rpc_method(data['params']))
		
		
	except Exception as e:
		traceback.print_exc()
		return {
			'error': str(e),
			#'traceback': traceback.format_exc()
		}
		
	return "rpc\n"

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

