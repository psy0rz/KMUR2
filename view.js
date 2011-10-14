function viewFieldsToSelector(fields)
{
	//create selector string from fields
	var selectorStr='';
	$.each(fields, function (i, field){
		if (typeof field=='number')
		{
			selectorStr+='.autoListItem:nth-child('+(field+1)+') ';
		}
		else
		{
			selectorStr+='.autoGet[_key="'+field+'"] ';
		}
	});
	
	return(selectorStr);
}


/*** Shows error and highlights field
 * Returns false if there are no errors to report
 * If there is 
 */
function viewShowError(result, parent)
{
	$(".autoError", parent).text("");
	$(".ui-state-error", parent).removeClass("ui-state-error");

	if (result!=null)
	{
		if ('error' in result)
		{
			//show in html element?
			if ($(".autoError", parent).size()!=0)
			{
				$(".autoError", parent).text(result.error.message);
				$(".autoError", parent).addClass("ui-state-error");

			}
			//create popup box
			else
			{
				$(parent).error({
					text: result.error.message,
					callback:function(){
						$(".ui-state-error", parent).removeClass("ui-state-error")
					}
				});
			}
			
			if ('fields' in result.error)
			{
				selectorStr=viewFieldsToSelector(result.error.fields);
				
				//console.log(selectorStr);
				$(selectorStr, parent).addClass("ui-state-error").focus();
				$(selectorStr, parent).addClass("ui-state-error");
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
	viewDiv.addClass("autoRefresh");
	
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


//send a refresh event to all .autoRefresh classes.
function viewRefresh()
{
	console.debug("Triggering refresh");
	$(".autoRefresh").trigger('refresh');

}


