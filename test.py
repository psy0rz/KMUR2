#!/usr/bin/env python

import beaker.middleware
import bottle


#rpc calls to models:
@bottle.route('/rpc')
def rpc():
	s = bottle.request.environ.get('beaker.session')
	return "rpc"

#serve static content from the static dir
#(in production the webserver should do this)
@bottle.route('/static/<filename:path>')
def send_static(filename):
    return bottle.static_file(filename, root='static')

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

