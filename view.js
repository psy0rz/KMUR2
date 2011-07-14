 
//links to a specifed view with specified parameters
//specify view as module.page

//function viewOpen(view, params)
//{
	
//	location.href="../"+view.replace(".","/")+"?"+encodeURI(JSON.stringify(params));
//}

function viewLoad(element, view, params)
{
	console.debug("view loading "+view, params);
	$.ajax({
		"dataType":		"html",
		"url":			"views/"+view.replace(".","/")+".php?"+encodeURI(JSON.stringify(params)),
		"success":	
			function (result, status, XMLHttpRequest)
			{
				console.debug("view result "+view, result);
				$(element).html(result);
			
//				$(element).execute();
			},
		"error":
			function (request, status, e)
			{
				console.error("Error while loading view via ajax request: ",request.responseText,status,e);
				$(element).text("Error while loading data: "+request.responseText);
			},

	});
			
}



