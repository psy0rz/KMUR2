/*** Shows error and highlights field
 * Returns false if there are no errors to report
 */
function viewShowError(result, parent)
{
	$(".autoError", parent).text("");
	$(".errorHighlight", parent).removeClass("errorHighlight");

	if (result!=null)
	{
		if (result["error"]!=null)
		{
			$(".autoError", parent).text(result["error"]["message"]);
			if (result["error"]["field"]!=null)
			{
				$(':input[_key|="'+result["error"]["field"]+'"]', parent).addClass("errorHighlight").focus();
				$('[_errorHighlight|="'+result["error"]["field"]+'"]', parent).addClass("errorHighlight");
			}
			return(true);
		}
	}
	return(false);
}



//loads a view in the specified element
function viewLoad(view, params, readyCallback)
{
	console.debug("view loading "+view, params);
	var uriParams=encodeURIComponent(JSON.stringify(params));
	
	$.ajax({
		"dataType":		"html",
		"url":			"views/"+view.replace(".","/")+".php?"+uriParams,
		"success":	
			function (result, status, XMLHttpRequest)
			{
				console.debug("view result "+view);

				//clear/unbind old stuff
				$(params.element).unbind();
				$(params.element).empty();
				
				//FIXME: better debugging of javascript inside html
				$(params.element).html(result);

				if (typeof readyCallback!='undefined')
					readyCallback();
			},
		"error":
			function (request, status, e)
			{
				console.error("Error while loading view via ajax request: ",request.responseText,status,e);
				$(params.element).text("Error while loading data: "+request.responseText);
			},

	});
			
}



//create a popup and loads the view in it.
var viewPopupCount=0;
function viewPopup(event, view, params, viewClosedCallback)
{
	var dialogDiv=$("<div>");
	dialogDiv.addClass("dialogDiv");
	
	
	var viewDiv=$("<div>");
	viewPopupCount++;
	var viewId="view"+viewPopupCount;
	viewDiv.attr("id",viewId);
	
	$("body").append(dialogDiv);	
	dialogDiv.append(viewDiv);
	
	var dialog=dialogDiv.dialog({
		height: 'auto',
		width: 'auto',
//		autoResize: true,
//		autoOpen: false,
		title: 'loading...',
		position: [ 
			event.clientX,
			event.clientY 
		],
		close: function(ev, ui) {
			$(this).remove();
			if (typeof viewClosedCallback!='undefined')
				viewClosedCallback();

		}
	});
	
	
	//store viewId in params, so that the view knows what its element is
	params.element="#"+viewId;

	viewLoad(view, 
			params,
			function()
			{
				
			}
	);
//	});
	
	
}

/** Called by view to indicate the popup created by viewPopup is ready and set some final options like title.
 */
function viewReady(options)
{
	
	//view is inside a dialogdiv?
	var dialogDiv=$(options.element).parent();
	if (dialogDiv.hasClass("dialogDiv"))
	{
		if (options)	
		{
			if ('title' in options)
				dialogDiv.dialog('option', 'title', options['title']);
		}
		
		//get correct dimentions
		var cw=$(options.element).width()+50;
		var ch=$(options.element).height()+100;
		console.debug("dialog content dimentions" ,cw,ch);
		

		//resize iframe so the contents fit
		dialogDiv.dialog('option','width',cw);
		dialogDiv.dialog('option','height',ch);
		//parent.$(self.frameElement).height(ch);

		//reset position, this makes sure the dialog stays inside the browserwindow
		var pos=dialogDiv.dialog('option', 'position');
		dialogDiv.dialog('option', 'position', pos);
	}
	
}

//closes the current view
function viewClose(element)
{
	//view is inside a dialogdiv?
	var dialogDiv=$(element).parent();
	if (dialogDiv.hasClass("dialogDiv"))
	{
			dialogDiv.dialog('close');
	}
}

//add a 'favorite' to the specified menu.
//automaticly keeps count of most used items
function viewAddFavorite(params)
{
	rpc(
		"menu.addFavorite",
		params,
		function(result)
		{
			//uppate menu?
		}
	);
}

//send a refresh event to all .autoRefresh classes.
//this starts at the top frame.
//viewPopup-frames have a autoRefresh handler that forwards the event inside the frame.
function viewTriggerRefresh(element)
{
	console.debug("Triggering refresh");
	$(element).trigger('refresh');
	if (parent!=self)
	{
		console.debug("Also triggering parent frame");
		parent.viewTriggerRefresh(parent.$(self.frameElement));
	}
}


//informs the original caller of viewPopup that the data has changed on the server
//function viewChanged(params)
//{
//	parent.$(self.frameElement).trigger("viewChanged",params);
//}

