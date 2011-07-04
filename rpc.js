
rpc_debug=false;

function rpc(class, method, params)
{
	if (rpc_debug)
		console.debug("rpc: "+class+"."+method+"( "+JSON.stringify(params)+" )");
	
	$.ajax({
		"dataType":		"json",
		"url":			'rpc.php',
		"error": 		rpc_handleReceiveError,
		"success":		rpc_handleResult,
		"type":			"post",
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

function rpc_handleResult(result, status, XMLHttpRequest)
{

	if (result==null)
	{
		console.error("Connection error.");
		return;
	}
	
	if (rpc_debug)
		console.info("rpc: result="+JSON.stringify(result));
	
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



