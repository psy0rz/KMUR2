

//array containing view status
//views will be created and destroyed by comparing this data to the url hash
var gViewStatus={
	count:0,
	views:{}
};

//initialize view history tracker
$(document).ready(function()
{
	$.history.init(function(hash){
		if (hash == "") 
			hash='{"count":0, "views":{}}';

		// hash changed, update views:
		console.log("view detected new url hash:", hash);
		console.log("view comparing to current viewstatus:", JSON.stringify(gViewStatus));
		
		var oldViewStatus={};
		$.extend(true, oldViewStatus, gViewStatus);
		var newViewStatus=JSON.parse(hash);

		//store the updated view state right away. (some objects do stuff with viewUpdateUrl when we delete or create them)
		gViewStatus=newViewStatus;

		//traverse the old views, and compare to new
		$.each(oldViewStatus.views, function(viewId, view)
		{
			//deleted?
			//(changed stuff will also be deleted and recreated below)
			if (! (viewId in newViewStatus.views))
			{
				console.log("view deleting: "+viewId);
				//if its a popup, delete it properly
				if (view.create=='popup')
				{
					var dialogDiv=$("#"+viewId).parent();
					dialogDiv.dialog('close'); //will delete itself
				}
				else
				//just clear it
				{
					$("#"+viewId).unbind();
					$("#"+viewId).empty();
				}
			}
		});

		//traverse the new views, and compare to old
		$.each(newViewStatus.views, function(viewId, view)
		{
//			console.log(gViewStatus[viewId], view);
			//new or changed
			if (
				(! (viewId in oldViewStatus.views)) || //new
				oldViewStatus.views[viewId].name!=view.name || //different view name or params?
				JSON.stringify(oldViewStatus.views[viewId].viewParams)!=JSON.stringify(view.viewParams) 
			)
			{
				//viewId doesnt exist yet?
				if ($("#"+viewId).length==0)
				{
					console.log("view creating: "+viewId);
					
					//create popup?
					if (view.create=='popup')
					{
						viewCreatePopup(viewId, view.x, view.y, view.highlight);
					}
					//doesnt exist and cant create it :(
					else
					{
						console.error("cant load view, element not found", viewId, view);
					}						
				}

				console.log("view loading: "+viewId);

				//store viewId in params, so that the view knows what its element is
				var viewParams={
					element:"#"+viewId
				};
				$.extend( viewParams, view.viewParams );
				
				//(re)load the view
				viewLoad(
					"#"+viewId,
					view.name,
					viewParams
				);
			}
		});
		
	});
});

// update the browser url with specified view.
// this will trigger the history tracker which in turn will create and delete actual view elements.
function viewUpdateUrl(id, viewData)
{
	//copy the current global viewstatus and expand it with this new view
	var viewStatus={};
	$.extend( true, viewStatus, gViewStatus );

	//no params is delete
	if (!viewData)
	{
		delete viewStatus.views[id];
	}
	//add/update
	else
	{
		viewStatus.views[id]=viewData;
		viewStatus.count++;		
	}
	
	//now copy the new views array to the browser url, triggering the history tracker which applies the actual changes:
	var hash=JSON.stringify(viewStatus);
	console.log("view changing url hash to: "+hash);
	jQuery.history.load(hash);
}

/* creates a new view of specified type, and calls viewLoad to load the view in it.
	name: name of the view. e.g. 'users.list' (will load views/users/list.php)
	viewParams: view specific parameters, used inside the view. (is passed along almost unchanged, only the selector of the container is added so the view can operate in that scope)
	mode:
		'main': load the view in the mainwindow. (TODO:deletes any open stacked windows)
		'popup': create a new popup window to load the view. 
		'existing': load view into an existing element id (see below)
		TODO:'stack': create new view to stack on top of mainwindow or other stacked views. This way the main window stays intact, so that when you close the stacked window and give the user the feeling he is back in the previous screen. This also highlights all the changes he made.
		
	x,y: (for mode 'popup') coordinates for popup
	id: (for mode 'existing'): id of the element to load the view in (e.g. 'view321bla')
	creator: (optional for mode 'popup'): element-object that was responsible for creating the popup. Will be used for popups to highlight the object. 

Loading views this way also ensures correct browser url and history updating.

Call viewClose to close the view.
*/
function viewCreate(params)
{
	
	var viewId="";
	var viewData={};

	if (params.mode=='popup')
	{
		viewId="view"+gViewStatus.count;

		viewData.x=params.x;
		viewData.y=params.y;
		viewData.create="popup";
		
		if (params.creator)
		{
			//TODO: create better method that doesnt need adding a class?
			$(params.creator).addClass(viewId);
			viewData.highlight=".view"+gViewStatus.count;
		}
		
	}
	else if (params.mode=='main')
	{
		viewId="viewMain";
	}
	else if (params.mode=='existing')
	{
		viewId=params.id;
	}
	else
	{
		console.error("viewCreate: Unknown view mode! ",params);
		return;
	}
	
	//set common options
	viewData.name=params.name;
	viewData.viewParams=params.viewParams;
	
	viewUpdateUrl(viewId, viewData);
}


//closes the specified view
function viewClose(id)
{
	//no data deletes view from url
	viewUpdateUrl(id);
}

/*** Shows error and highlights field
 * Returns false if there are no errors to report
 */
function viewShowError(result, parent, meta)
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
				$(".autoGet", parent).autoFindField(meta, result.error.fields)
					.addClass("ui-state-error").focus();
			}
			return(true);
		}
	}
	return(false);
}

//creates an empty popup window. dont call directly, used internally
//returns the viewdiv
function viewCreatePopup(id, x, y, highlight)
{
	if (highlight)
		$(highlight).addClass("ui-state-highlight");

	var dialogDiv=$("<div>");
	dialogDiv.addClass("viewPopup");
	
	var viewDiv=$("<div>");
	viewDiv.attr("id",id);
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
			x,
			y 
		],
		close: function(ev, ui) {
			$(this).remove();
			if (highlight)
				$(highlight).removeClass("ui-state-highlight");
			//NOTE: this "loops": the url will be updated, triggering a history event. then the open views will be compared to the wanted views. views that are popups will be deleted by calling this close function. shouldnt be a problem, since we are already gone by the time this happens.
			viewClose(id);
		}
	});
	
	return(viewDiv);
}

//loads a view in the specified element
//( use viewCreate instead, if you want to update browser history and create popups etc)
function viewLoad(selector, view, viewParams)
{
	console.debug("viewLoad", selector, view, viewParams);
	var uriParams=encodeURIComponent(JSON.stringify(viewParams));
	
	$.ajax({
		"dataType":		"html",
		"url":			"views/"+view.replace(".","/")+".php?"+uriParams,
		"success":	
			function (result, status, XMLHttpRequest)
			{
				console.debug("viewLoad success "+view);
				console.log(selector, $(selector));

				//clear/unbind old stuff
				$(selector).unbind();
				$(selector).empty();
				
				//FIXME: better debugging of javascript inside html
				$(selector).html(result);

			},
		"error":
			function (request, status, e)
			{
				console.error("Error while loading view via ajax request: ",request.responseText,status,e);
				$(selector).text("Error while loading data: "+request.responseText);
			},
	});
			
}


/** Called by the view to indicate its ready and set some final options like title.
 */
function viewReady(options)
{
	
	//view is inside a dialogdiv?
	var dialogDiv=$(options.element).parent();
	if (dialogDiv.hasClass("viewPopup"))
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

//send a refresh event to all .autoRefresh classes.
function viewRefresh()
{
	console.debug("Triggering refresh");
	$(".autoRefresh").trigger('refresh');

}


