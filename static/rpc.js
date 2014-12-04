

var gLogTime=0;
var gActiveRpcs=0;

/*
    Does a remote procedure call to the server.

    moduleClassMethod: specify the method-name to call in dot-notation. (module.Class.method)
    params: specifies parameters to pass to the method.
    callback: specifies function to be called with the result data. its always called, also in case of error.
    debugTxt: a descriptive text for debugging (usually specifies which view did the call and why)

    (this needs more documentaion about all the extra fields that are returned by the server and interpreted by this function)

    Also does caching.

*/



var gRpcCache={};

function rpc(moduleClassMethod, params, callback, debugTxt)
{
    if (!debugTxt)
        debugTxt="rpc "+moduleClassMethod;
    else
        debugTxt="[ "+debugTxt+" ] rpc "+moduleClassMethod;


    var cacheKey=moduleClassMethod+JSON.stringify(params);
    var cacheEntry={};

    //first check if we can use the cache:
    if ((cacheKey in gRpcCache))
    {
        cacheEntry=gRpcCache[cacheKey];
        if (cacheEntry.inProgress)
        {
            //still in progress, add our callback to the queue
            if (callback==undefined)
            {
                console.debug(debugTxt+" IGNORED", params);
            }
            else
            {
                console.debug(debugTxt+" QUEUED", params);
                cacheEntry.callbacks.push(callback);                
            }
        }
        else
        {
            //FIXME: expire entrys

            //existing entry still valid
            console.debug(debugTxt+" RE-USING "+cacheKey, params);
            callback(cacheEntry.result);
        }
        return;
    }

    //create new cache entry, and do the actual rpc.
    gRpcCache[cacheKey]={
        inProgress: true,
        callbacks: []
    }
    cacheEntry=gRpcCache[cacheKey];
    if (callback!=undefined)
        cacheEntry.callbacks.push(callback);                


    gActiveRpcs++;
    $(".viewLoading").show();
    $("body").css('cursor','progress');
    function rpcEnd()
    {
        gActiveRpcs--;
        if (gActiveRpcs!=0)
            return;
        
        $(".viewLoading").hide();
        $("body").css('cursor','auto');
    }

    var moduleClassMethodArray=moduleClassMethod.split(".");
    var request={
                "module":moduleClassMethodArray[0],
                "class":moduleClassMethodArray[1],
                "method":moduleClassMethodArray[2],
                "debug":gDebuggingEnabled,
                "help":gDebuggingEnabled,
                "params":params
            };
//    console.debug(debugTxt, "REQUEST", request);
    var start_time=new Date().getTime();

    //File-objects need to be transferred out-of-band by using multipart/form-data. The server supports this.
    //For performance reasons we only support a File-object thats stored in params.file in the client. (the server supports more)
    //maybe later we will support files at all root-level parameters, or maybe even recursively.
    var data;
    var content_type;
    if (params!=undefined && params.file instanceof File)
    {
        //multipart/form-data upload-mode: 
        data=new FormData();
        data.append("rpc", JSON.stringify(request));
        data.append("file", params.file);
        content_type=false;
    }
    else
    {
        //simple json-only post:
        data=JSON.stringify(request);
        content_type="application/json";
    }


    $.ajax({
        "dataType":     "json", //datatype returned from server
        "url":          "rpc",
        "type": "post",
        "data": data,
        "contentType": content_type,
        "processData":  false,
        "cache":        false,
        "error":
            function (request, status, e)
            {
    
                console.error(debugTxt, "Error while doing rpc ajax request: ",request.responseText,status,e);
                
                {
                    var debugDiv=$("<div class='debug'>");
                    debugDiv.append(debugTxt+": RPC request failed");
                    debugDiv.append("<pre>"+request.responseText+"</pre>");
                    debugDiv.append("<pre>"+JSON.stringify(status, null, ' ')+"</pre>");
                    debugDiv.append("<pre>"+JSON.stringify(e, null, ' ')+"</pre>");
                    $('#viewDebug').prepend(debugDiv);
                }
                    
                error={
                    "error":{
                        "message":"Error while contacting server: "+request.responseText
                    }
                };
                rpcEnd();

                cacheEntry.inProgress=false;
                cacheEntry.result=result;
                for (i in cacheEntry.callbacks)
                {
                    cacheEntry.callbacks[i](error);
                };

                //dont cache network errors
                delete gRpcCache[cacheKey];

            },
        "success":  
            function (result, status, XMLHttpRequest)
            {
                
                // console.debug(debugTxt + " RESULT ("+((new Date().getTime())-start_time)+"ms)", result);
                console.debug(debugTxt + " REQUEST/RESULT ("+((new Date().getTime())-start_time)+"ms)", request, result);
                start_time=new Date().getTime();

                if (gDebuggingEnabled && ('error' in result))
                {
                    var errorTxt=debugTxt+" : rpc result contains error message: "+result.error.message;
                    console.error(errorTxt, params,result);
                    var debugDiv=$("<div class='debug'>");
                    debugDiv.append(errorTxt);
                    //debugDiv.append("Request: <pre>"+JSON.stringify(result, null, ' ')+"</pre>");
                    $('#viewDebug').prepend(debugDiv);
                }

                //print debug info
                if (result.debug)
                {
                    $.each(result.debug, function(i,debugLine)
                    {
                        console.debug(debugTxt, "server debugging output from "+debugLine.file+" line "+debugLine.line+":",debugLine.object);
                        var debugDiv=$("<div class='debug'>");
                        debugDiv.append(debugTxt+": "+ debugLine.file+" line "+debugLine.line+":");
                        debugDiv.append("<pre>"+JSON.stringify(debugLine.object, null, ' ')+"</pre>");
                        $('#viewDebug').prepend(debugDiv);
                    });
                }
                
                //print log info
                var currentTime=new Date().getTime();

//              if (currentTime-gLogTime>5000)
//                  $('#viewLog').empty();

                if (result.logs)
                {
//                  $('#viewLog').empty();
                    gLogTime=currentTime;
                    $.each(result.logs, function(i,logLine)
                    {
                        var logDiv;
                        if (logLine.type=='info')
                        {
                            logDiv=$('<div class="log log-not-removed ui-corner-all" ><span class="ui-icon ui-icon-info" style="display: inline-block; margin-right: .3em;"></span><strong>Info: </strong><span class="logtxt"></span></div>');
                        }
                        else if (logLine.type=='warning')
                        {
                            logDiv=$('<div class="log log-not-removed ui-state-highlight ui-corner-all" ><span class="ui-icon ui-icon-alert" style="display: inline-block; margin-right: .3em;"></span><strong>Warning: </strong><span class="logtxt"></span></div>');
                        }
                        else
                        {
                            logDiv=$('<div class="log log-not-removed ui-state-error ui-corner-all" ><span class="ui-icon ui-icon-alert" style="display: inline-block; margin-right: .3em;"></span><strong>Error: </strong><span class="logtxt"></span></div>');
                        }
                        $(".logtxt", logDiv).text(logLine.text);                            
                        $('#viewLog').append(logDiv);

                        //some effects
                        logDiv.effect('highlight',2000).delay(10000).switchClass("","ui-state-disabled",4000);

                        //remove excessive log lines
                        if ($('#viewLog .log-not-removed').length>4)
                        {
                            $($('#viewLog .log-not-removed').first().removeClass('log-not-removed').stop(true,true).fadeOut(8000, function()
                                {
                                    $(this).remove();

                                }));
                        }
                        

                    });
                }

                
                rpcEnd();

                //first call back, then do events. this is neccesary for inplace editting 
                cacheEntry.inProgress=false;
                cacheEntry.result=result;
                for (i in cacheEntry.callbacks)
                {
                    cacheEntry.callbacks[i](result);
                };
                cacheEntry.callbacks=[];

                //broadcast events
                for (i in result.events)
                {
                    $.publish(result.events[i][0], result.events[i][1]);
                }

                console.debug(debugTxt+ " PROCESSED ("+((new Date().getTime())-start_time)+"ms)");

            }
    });
}

/*
    Does a rpc and caches result and solves raceconditions.

    cache should be a object, used to store all kinds of neccesary data of THIS rpc call. 
    the caller should make sure this object is unique for every rpc/parameter combo.

    ttl is the maximum time (in seconds) to store results, after that a new call will be made. 

    if a new call is made while another call is already in progress, then the callback will be queued and called as soon as the 
    orginal call is ready.

*/
function rpc_cached(cache, ttl, moduleClassMethod, params, callback, debugTxt)
{

    rpc(moduleClassMethod, params, callback, debugTxt);

    return;

    var debugTxtcached;
    if (!debugTxt)
        debugTxtcached="rpc cached "+moduleClassMethod;
    else
        debugTxtcached="< "+debugTxt+" > rpc cached "+moduleClassMethod;

    if (cache.in_progress)
    {
        console.debug(debugTxtcached, "already in progress, queued callback");
        cache.callbacks.unshift(callback);
    }
    else
    {
        var now=new Date().getTime()/1000;
        //do we already have a result which is fresh enough?
        if (
            ('request_time' in cache) &&
            ((now-cache.request_time)<ttl)
            )
        {
            //return cached copy
            console.debug(debugTxtcached, "returning cached copy");
            callback(cache.result);            
        }
        else
        {
            //make new call
            console.debug(debugTxtcached, "no cached copy, requesting new one");

            cache.in_progress=true;
            cache.callbacks=[callback];

            rpc(
                moduleClassMethod,
                params,
                function(result)
                {
                    cache.result=result;
                    cache.request_time=now;
                    cache.in_progress=false;                    
                    console.debug(debugTxtcached, "returning result to callbacks: ",cache.callbacks.length);
                    while(cache.callbacks.length)
                    {
                        cache.callbacks.pop()(result);
                    }
                },
                debugTxt
                );
        }
    }
}


$(document).ready(function(){
    $("#viewDebug").click(function()
            {
                $(this).empty();
            });
});




