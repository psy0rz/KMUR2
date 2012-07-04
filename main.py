#!/usr/bin/env python

import beaker.middleware
import bottle
import re
import traceback
import models.common
import fields
import json

# curl -b /tmp/cookies -c /tmp/cookies --data-binary '{ "module":"core","class":"Users", "method":"test", "params":1 }' -H "Content-Type: application/json"  http://localhost:8080/rpc


#rpc calls to models:
@bottle.post('/rpc')
def rpc():
    session = bottle.request.environ.get('beaker.session')

    #result will be stored here:
    result = {}

    try:
        #to see what kind of body the server receives, for debugging purposes:
        #print bottle.request.body.getvalue()
        request = bottle.request.json


        if "help" in request and request["help"]:
            dohelp = True
            result['help'] = {}
        else:
            dohelp = False

        if not "module" in request:
            raise Exception("Module not specified")

        if re.search("[^a-zA-Z0-9_]", request['module']):
            raise Exception("Illegal module name")

        if not "class" in request:
            raise Exception("Class not specified")

        if re.search("[^a-zA-Z0-9]", request['class']):
            raise Exception("Illegal class name")

        if not "method" in request:
            raise Exception("Method not specified")

        if re.search("[^a-zA-Z0-9_]", request['method']):
            raise Exception("Illegal method name")

        if re.search("^_", request['method']):
            raise Exception("Methodname may not begin with _")

        if not "params" in request:
            raise Exception("Params not specified")

        #load module and resolve class
        rpc_models = __import__('models.' + request['module'] + '.' + request['class'])
    
        rpc_module = getattr(rpc_models, request['module'])
        if dohelp:
            result['help']['module'] = rpc_module.__doc__

        rpc_package = getattr(rpc_module, request['class'])
        rpc_class = getattr(rpc_package, request['class'])
        if dohelp:
            result['help']['class'] = rpc_class.__doc__

        #create context if its non existant for this session
        if not 'context' in session:
            session['context'] = models.common.Context()

        session['context'].reinit(debug=('debug' in request and request['debug']))

        #instantiate class
        rpc_class_instance = rpc_class(session['context'])
        if not isinstance(rpc_class_instance, models.common.Base):
            raise Exception("Class is not a model")

        #resolve method
        rpc_method = getattr(rpc_class_instance, request['method'])

        #make sure that it has an acl
        if not hasattr(rpc_method, 'has_acl_decorator'):
            raise Exception("This method is protected from outside access because it has no @Acl decorator")

        if dohelp:
            result['help']['method'] = rpc_method.__doc__

        #call method with specified parameters
        result['data'] = rpc_method(**request['params'])

    except (fields.FieldException, Exception) as e:
        traceback.print_exc()
        result['error'] = str(e)

        if isinstance(e, fields.FieldException):
            result['fields'] = e.fields

    session.save()

    if 'context' in session:
        result.update(session['context'].get_results())

    #return JSON string;
    return(json.dumps(result, cls=fields.JSONEncoder, indent=1, ensure_ascii=False))


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
    'session.data_dir': '.beakersessions'
}


app = beaker.middleware.SessionMiddleware(
                                          bottle.default_app(),
                                          session_opts)

#debug mode
bottle.debug(True)
bottle.run(reloader=True, app=app, host='localhost', port=8080)

#production:
#bottle.run(app=app, host='localhost', port=8080)
