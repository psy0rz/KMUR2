/*** Shows error and highlights field
 * Returns false if there are no errors to report
 */
function viewShowError(result, parent)
{
	$("#error", parent).text("");
	$(".errorHighlight", parent).removeClass("errorHighlight");

	if (result!=null)
	{
		if (result["error"]!=null)
		{
			$("#error", parent).text(result["error"]["message"]);
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
	var frame=$("<div>");
	
	viewPopupCount++;
	var viewId="view"+viewPopupCount;
	frame.attr("id",viewId);

	$("body").append(frame);

	
	var dialog=frame.dialog({
		height: 'auto',
		width: 'auto',
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
	
//	frame.attr("src","viewPopup.php");

//	frame.load(function(){
//		frame[0].contentWindow.viewLoad(
//		frame[0].contentWindow.viewLoad(
	
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
	if (options)
	{
		if ('title' in options)
			$(self.frameElement).parent().find(".ui-dialog-title").text(options['title']);
	}
	
	//get correct dimentions
	var cw=$("#viewMain").width()+100;
	var ch=$("#viewMain").height()+100;
	console.debug("dialog content dimentions" ,cw,ch);
	
	var bw=$(parent.window).width();
	var bh=$(parent.window).height();
	console.debug("browser window size" ,bw,bh);

	if (cw>bw)
		cw=bw;
	if (ch>bh)
		ch=bh;
	
	//calculate border overhead
	console.debug(parent.$(self.frameElement).parent().width(), parent.$(self.frameElement).width());
	console.debug(parent.$(self.frameElement).parent());

	var ow=parent.$(self.frameElement).dialog('option','width')-parent.$(self.frameElement).width();
	console.debug("border overhead width and height", ow);

	//resize iframe so the contents fit
	parent.$(self.frameElement).dialog('option','width',cw);
	parent.$(self.frameElement).dialog('option','height',ch);
	//parent.$(self.frameElement).height(ch);

	//reset position, this makes sure the dialog stays inside the browserwindow
	var pos=parent.$(self.frameElement).dialog('option', 'position');
	parent.$(self.frameElement).dialog('option', 'position', pos);
	
	
}

//closes the current view
function viewClose()
{
	parent.$(self.frameElement).dialog('close');
	//$("#viewMain").html();
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

