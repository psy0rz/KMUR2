
rpc_debug=false;

function rpc(classMethod, params, callback)
{
	if (rpc_debug)
		console.debug("rpc: "+classMethod+"( "+JSON.stringify(params)+" )");

	class=classMethod.substr(0,classMethod.indexOf("."));
	method=classMethod.substr(classMethod.indexOf(".")+1);
	
	$.ajax({
		"dataType":		"json",
		"url":			'rpc.php',
		"error": 		rpc_handleReceiveError,
		"success":	
			function (result, status, XMLHttpRequest)
			{

				if (result==null)
				{
					console.error("Connection error.");
					return;
				}
				
				if (rpc_debug)
					console.info("rpc: result="+JSON.stringify(result));
				
				callback(result);
			},
		"type": "post",
		"data": {
				"class":class,
				"method":method,
				"params":JSON.stringify(params)
			},
		"processData":	true,
		"cache":		false
	});
}



function rpc_handleReceiveError(request, status, e)
{
	errorTxt="RPC error: " + request.responseText;
	console.error(errorTxt);
}



function rpc_handleSendError(request, status, e)
{
	errorTxt="Send error: " + request.responseText;
	console.error(errorTxt);
}

function rpc_handleSend(request, status, e)
{
}


$(document).ready(function(){
	
	
	rpc_debug=(window.location.search.indexOf('rpc.debug') != -1);

	if (rpc_debug)
		console.debug("rpc: debugging enabled");

});



