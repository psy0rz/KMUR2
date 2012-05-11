#!/usr/bin/env python

import beaker.middleware
import bottle
import re


#rpc calls to models:
@bottle.post('/rpc')
def rpc():
	s = bottle.request.environ.get('beaker.session')
	#print bottle.request.json
	data=bottle.request.json
	if re.search("[^a-zA-Z0-9_]", data['class']):
		raise "kut"
	
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

