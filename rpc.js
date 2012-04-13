

var gLogTime=0;
var gActiveRpcs=0;

function rpc(classMethod, params, callback)
{
	console.debug("rpc call "+classMethod+": ", params);

	classname=classMethod.substr(0,classMethod.indexOf("."));
	method=classMethod.substr(classMethod.indexOf(".")+1);
	
	//(add extra info to the url for easier debugging in webserver logs)
	gActiveRpcs++;
	$(".viewLoading").show();
	//$("body").css('cursor','progress');
	function rpcEnd()
	{
		gActiveRpcs--;
		if (gActiveRpcs!=0)
			return;
		
		$(".viewLoading").hide();
		//$("body").css('cursor','');
	}
	
	$.ajax({
		"dataType":		"json",
		"url":			"rpc.php",
		"error":
			function (request, status, e)
			{
	
				console.error("Error while doing rpc ajax request: ",request.responseText,status,e);
				error={
					"error":{
						"message":"Error while contacting server: "+request.responseText
					}
				};
				callback(error);

				rpcEnd();
			},
		"success":	
			function (result, status, XMLHttpRequest)
			{
				
				console.debug("rpc result "+classMethod+": ", result);

				if ('error' in result)
				{
					var errorTxt="rpc result contains error message: "+result.error.message;
					console.error(errorTxt, result);
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
						var debugDiv=$("<div class='debug'>");
						debugDiv.append(debugLine.file+" line "+debugLine.line+":");
						debugDiv.append("<pre>"+JSON.stringify(debugLine.object, null, ' ')+"</pre>");
						$('#viewDebug').prepend(debugDiv);
					});
				}
				
				//print log info
		        var currentTime=new Date().getTime();

				if (currentTime-gLogTime>5000)
					$('#viewLog').empty();

				if (result.log)
				{
					$('#viewLog').empty();
					gLogTime=currentTime;
						$.each(result.log, function(i,logLine)
					{
						var logDiv;
						if (logLine.logType=='info')
						{
							logDiv=$('<div class="log ui-state-highlight ui-corner-all" ><span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span><strong>Info: </strong><span class="logtxt"></span></div>');
						}
						else if (logLine.logType=='warning')
						{
							logDiv=$('<div class="log ui-state-error ui-corner-all" ><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span><strong>Let op: </strong><span class="logtxt"></span></div>');
						}
						else
						{
							logDiv=$('<div class="log ui-state-error ui-corner-all" ><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span><strong>Fout: </strong><span class="logtxt"></span></div>');
						}
						$(".logtxt", logDiv).text(logLine.text);							
						$('#viewLog').append(logDiv);
					});
				}
				
				callback(result);

				rpcEnd();
			},
		"type": "post",
		"data": {
				"class":classname,
				"method":method,
				"debuggingEnabled":debuggingEnabled,
				"params":JSON.stringify(params)
			},
		"processData":	true,
		"cache":		false
	});
}

$(document).ready(function(){
	$("#viewDebug").click(function()
			{
				$(this).empty();
			});
});




