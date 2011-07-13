
rpc_debug=false;

function rpc(classMethod, params, callback)
{
	if (rpc_debug)
		console.debug("rpc: "+classMethod+"( "+JSON.stringify(params)+" )");

	class=classMethod.substr(0,classMethod.indexOf("."));
	method=classMethod.substr(classMethod.indexOf(".")+1);
	
	//(add extra info to the url for easier debugging in webserver logs)
	$.ajax({
		"dataType":		"json",
		"url":			"../../rpc.php/"+class+"."+method,
		"error":
			function (request, status, e)
			{
				console.error("Error while doing ajax call: ",request.responseText,status,e);
				error={
					"error":{
						"message":"Error while contacting server: "+request.responseText
					}
				};
				callback(error);
			},
		"success":	
			function (result, status, XMLHttpRequest)
			{
				
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





function rpc_handleSendError(request, status, e)
{
	errorTxt="Send error: " + request.responseText;
	console.error(errorTxt);
}



$(document).ready(function(){
	
	
	rpc_debug=(window.location.search.indexOf('rpc.debug') != -1);

	if (rpc_debug)
		console.debug("rpc: debugging enabled");

});



