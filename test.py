#! /usr/bin/env python

from wsgiref.simple_server import make_server
from beaker.middleware import SessionMiddleware
import beaker

import models.ticket.invoice
#import models.core.users





def application(environ, start_response):
	# Sorting and stringifying the environment key, value pairs
	response_body = ['%s: %s' % (key, value)
	                 for key, value in sorted(environ.items())]
	response_body = '\n'.join(response_body)

	session=environ['beaker.session']
	if 'counter' in session:
		session['counter']=session['counter']+1
	else:
		session['counter']=0
	
	session.save()

#	response_body="geert {}\n".format(session['counter'])

	status = '200 OK'
	response_headers = [('Content-Type', 'text/plain'),
			('Content-Length', str(len(response_body)))]
	start_response(status, response_headers)

	return [response_body]

   
session_opts = {
    'session.type': 'file',
    'session.cookie_expires': True,
    'session.data_dir': '/tmp/testsessions'
}
wsgi_app = SessionMiddleware(application, session_opts)

# Instantiate the WSGI server.
# It will receive the request, pass it to the application
# and send the application's response to the client
httpd = make_server(
   'localhost', # The host name.
   8051, # A port number where to wait for the request.
   wsgi_app # Our application object name, in this case a function.
   )



httpd.handle_request()
#httpd.serve_forever()
