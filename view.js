

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
			hash="('count':0,'views':())";

		// hash changed, update views:
		console.log("view detected new url hash:", hash);
		console.log("view comparing to current viewstatus:", JSON.stringify(gViewStatus));
		
		var oldViewStatus={};
		$.extend(true, oldViewStatus, gViewStatus);
		var newViewStatus=rison.decode(hash);

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
				if (view.mode=='popup')
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
				JSON.stringify(oldViewStatus.views[viewId].params)!=JSON.stringify(view.params) 
			)
			{
				//viewId doesnt exist yet?
				if ($("#"+viewId).length==0)
				{
					console.log("view creating: "+viewId);
					
					//create popup?
					if (view.mode=='popup')
					{
						viewCreatePopup(view);
					}
					//doesnt exist and cant create it :(
					else
					{
						console.error("cant load view, element not found", viewId, view);
					}						
				}

				console.log("view loading: "+viewId);

				//(re)load the view
				viewLoad(view);
			}
		});
	},
	{ 'unescape': true } //dont urlencode 	
	);
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
	var hash=rison.encode(viewStatus);
	console.log("view changing url hash to: "+hash);
	jQuery.history.load(hash);
}

/* creates a new view of specified type, and calls viewLoad to load the view in it.
	name: name of the view. e.g. 'users.list' (will load views/users/list.php)
	params: view specific parameters, used inside the view. (passed along without changing)
	mode:
		'main': load the view in the mainwindow. (TODO:deletes any open stacked windows)
		'popup': create a new popup window to load the view. 
		'existing': load view into an existing element id (see below)
		TODO:'stack': create new view to stack on top of mainwindow or other stacked views. This way the main window stays intact, so that when you close the stacked window and give the user the feeling he is back in the previous screen. This also highlights all the changes he made.
		
	x,y: (for mode 'popup') coordinates for popup
	id: id of the element to load the view in (auto set in case of main and popup)
	creator: (optional for mode 'popup'): element-object that was responsible for creating the popup. Will be used for popups to highlight the object. 

Loading views this way also ensures correct browser url and history updating.

Call viewClose to close the view.
*/
function viewCreate(params)
{
	//create copy to work on:
	var viewData={};
	$.extend(true, viewData, params);

	if (viewData.mode=='popup')
	{
		viewData.id="view"+gViewStatus.count;
		
		//highlight a creator?
		if (viewData.creator)
		{
			//TODO: change this system?
			$(viewData.creator).addClass(viewData.id);
			viewData.highlight="."+viewData.id;
			delete viewData.creator;
		}
		else
		{
			//(when reinvoked from favorites, the highlight object wont exist anymore)
			delete viewData.highlight;
		}
		
	}
	else if (params.mode=='main')
	{
		viewData.id="viewMain";
	}
	
	viewUpdateUrl(viewData.id, viewData);
}


//closes the specified view
function viewClose(view)
{
	//no data deletes view from url
	viewUpdateUrl(view.id);
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
function viewCreatePopup(view)
{
	if (view.highlight)
		$(view.highlight).addClass("ui-state-highlight");

	var dialogDiv=$("<div>");
	dialogDiv.addClass("viewPopup");
	
	var viewDiv=$("<div>");
	viewDiv.attr("id",view.id);
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
			view.x,
			view.y 
		],
		close: function(ev, ui) {
			$(this).remove();
			if (view.highlight)
				$(view.highlight).removeClass("ui-state-highlight");
			//NOTE: this "loops": the url will be updated, triggering a history event. then the open views will be compared to the wanted views. views that are popups will be deleted by calling this close function. shouldnt be a problem, since we are already gone by the time this happens.
			viewClose(view);
		}
	});
}

//loads a view in the specified element
//( use viewCreate instead, if you want to update browser history and create popups etc)
function viewLoad(view)
{
	console.debug("viewLoad", view);
	var uriParams=encodeURIComponent(JSON.stringify(view));
	
	$.ajax({
		"dataType":		"html",
		"url":			"views/"+view.name.replace(".","/")+".php?"+uriParams,
		"success":	
			function (result, status, XMLHttpRequest)
			{
				console.debug("viewLoad success ",view);

				//clear/unbind old stuff
				$("#"+view.id).unbind();
				$("#"+view.id).empty();
				
				//FIXME: better debugging of javascript inside html
				$("#"+view.id).html(result);

			},
		"error":
			function (request, status, e)
			{
				console.error("Error while loading view via ajax request: ",request.responseText,status,e);
				$("#"+view.id).text("Error while loading data: "+request.responseText);
			},
	});
			
}


/** Called by the view to indicate its ready and set some final options like title. And do things like resizing.
 */
function viewReady(params)
{
	var viewDiv=$("#"+params.view.id);
	
	//view is inside a dialogdiv?
	var dialogDiv=viewDiv.parent();
	if (dialogDiv.hasClass("viewPopup"))
	{
		if ('title' in params)
			dialogDiv.dialog('option', 'title', params.title);
		
		//get correct dimentions
		var cw=viewDiv.width()+50;
		var ch=viewDiv.height()+100;
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


