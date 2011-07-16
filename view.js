 
//loads a view in the specified element
function viewLoad(element, view, params, readyCallback)
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
				if (typeof readyCallback!='undefined')
					readyCallback();
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

//create a popup (iframe) and loads the view in it.
//calls readyCallback when its closed.
function viewPopup(view, params, readyCallback)
{
	var frame=$("<iframe>");

	$("body").append(frame);

	var dialog=frame.dialog({
		height: 'auto',
		width: 'auto',
		close: function(ev, ui) {
			$(this).remove(); 
		}
	});
	
	
	frame.attr("src","viewPopup.php");

	frame.load(function(){
		frame[0].contentWindow.viewLoad(
				"#viewMain",
				view, 
				params,
				function()
				{
					frame.contentWindow.height("100%");
					frame.contentWindow.width("100%");
				}
		);

	});
}

