#!/usr/bin/env python3


import beaker.middleware
import bottle
import re
import traceback
import json
import sys
import os.path

#add directory of this file to python searchpath:
sys.path.append(os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

#load basics:
import fields
import models.common

# curl -b /tmp/cookies -c /tmp/cookies --data-binary '{ "module":"core","class":"Users", "method":"test", "params":1 }' -H "Content-Type: application/json"  http://localhost:8080/rpc


#rpc POST calls to models.
#usually used for json data communication
@bottle.post('/rpc')
def rpc_post():

    session = bottle.request.environ.get('beaker.session')

    #result will be stored here:
    result = {}

    try:
        #to see what kind of body the server receives, for debugging purposes:
        # print ("HEADERS: ", dict(bottle.request.headers))
        # print ("BODY: ", bottle.request.body.getvalue())
        # print ("FILES: ", dict(bottle.request.files))
        # print ("FORMS:", dict(bottle.request.forms))
        # print ("CONTENTTYPE", request.content-type)

        if bottle.request.headers["content-type"].find("application/json")==0:
            request = bottle.request.json
        elif bottle.request.headers["content-type"].find("multipart/form-data")==0:
            #In case of multipart/form-data, the json-encoded string should be passed inside a form variable called 'rpc'
            #The uploaded files will be passed to the rpc function by their form-variable names. (overwriting any names in the rpc-parameters)
            #These will be bottle FileUpload objects.
            request = json.loads(bottle.request.forms["rpc"])
            if not "params" in request:
                request['params']={}

            # #store filehandles of uploaded files in request object
            # for bottle_file in bottle.request.files:
            #     request['params'][bottle_file]=bottle.request.files[bottle_file].file
            request['params'].update(bottle.request.files)

        else:
            bottle.response.status=500
            return("Dont know how to handle content-type: "+bottle.request.headers["content-type"])


        if "help" in request and request["help"]:
            dohelp = True
            result['help'] = {}
        else:
            dohelp = False

        if not "module" in request:
            raise Exception("rpc: Module not specified")

        if re.search("[^a-zA-Z0-9_]", request['module']):
            raise Exception("rpc: Illegal module name")

        if not "class" in request:
            raise Exception("rpc: Class not specified")

        if re.search("[^a-zA-Z0-9]", request['class']):
            raise Exception("rpc: Illegal class name")

        if not "method" in request:
            raise Exception("rpc: Method not specified")

        if re.search("[^a-zA-Z0-9_]", request['method']):
            raise Exception("rpc: Illegal method name")

        if re.search("^_", request['method']):
            raise Exception("rpc: Methodname may not begin with _")

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
            raise Exception("rpc: Class is not a model")

        #resolve method
        rpc_method = getattr(rpc_class_instance, request['method'])

        #make sure that it has an acl
        if not hasattr(rpc_method, 'has_acl_decorator'):
            raise Exception("rpc: This method is protected from outside access because it has no @Acl decorator")

        if dohelp:
            result['help']['method'] = rpc_method.__doc__

        #call method with specified parameters
        if 'params' in request:
            result['data']=rpc_method(**request['params'])
        else:
            result['data']=rpc_method()


    except (fields.FieldError, Exception) as e:
        traceback.print_exc()
        if isinstance(e, fields.FieldError):
            result['error'] = { 
                'message': str(e), 
                'fields': e.fields
            }
        else:
            result['error'] = { 'message': e.__class__.__name__ + ": " + str(e) }

    finally:
        for fileupload in bottle.request.files.itervalues():
            fileupload.file.close()
    
    if 'context' in session:
        result.update(session['context'].get_results())

    session.save()

    indent=None
    if ('debug' in request and request['debug']):
        indent=' '

    #return JSON string. this can throw exceptions as well during conversion of some objects (like mongo cursors)
    try:
        return(json.dumps(result, cls=fields.JSONEncoder, indent=indent, separators=(',', ':'), ensure_ascii=False))
    except (Exception) as e:
        traceback.print_exc()
        result['error'] = { 'message': str(e) }
        #remove data from the result, hoping that this solves it
        del(result['data'])
        #try again, hopefully without throwing more exceptions
        return(json.dumps(result, cls=fields.JSONEncoder, indent=indent, separators=(',', ':'), ensure_ascii=False))


#simple rpc GET interface
#usually used to download files from models:
# /rpc/module/class/method/par1/par2/par...
#litterally passes parameters as strings to the rpc-method, and returns the result without additional data or postprocessing
#In case of an error it returns reponsecode 500 with the error string
@bottle.get('/rpc/<filename:path>')
def rpc_get(filename):
    match=re.match("(.*?)/(.*?)/(.*?)/(.*)", filename)

    get_module=match.group(1)
    get_class=match.group(2)
    get_method=match.group(3)

    if match.group(4)=="":
        get_params=[]
    else:
        get_params=match.group(4).split("/")

    session = bottle.request.environ.get('beaker.session')

    try:
        if not 'context' in session:
            session['context'] = models.common.Context()

        session['context'].reinit()

        #login via get-parameters?
        if bottle.request.query.username:
            models.common.call_rpc(session['context'], "core", "Users", "login", name=bottle.request.query.username, password=bottle.request.query.password)

        result=models.common.call_rpc(session['context'], get_module, get_class, get_method, *get_params)
        session.save()
        return(result)

    except (Exception) as e:
        traceback.print_exc()
        session.save()
        #bottle.abort(500, "Exception during request. "+e.__class__.__name__ + ": " + str(e))
        bottle.response.status=500
        return("Exception during request. "+e.__class__.__name__ + ": " + str(e))



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
    'session.cookie_expires': False,
    'session.data_dir': '/tmp/.kmur2beakersessions'
}


application = beaker.middleware.SessionMiddleware(
                                          bottle.default_app(),
                                          session_opts)

#standalone/debug mode:
if __name__ == '__main__':
    bottle.debug(True)
    bottle.run(reloader=True, app=application, host='localhost', port=8080)

