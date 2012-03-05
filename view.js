

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

		//always keep highest counter
		if (oldViewStatus.count>newViewStatus.count)
			newViewStatus.count=oldViewStatus.count;

		//store the updated view state right away. (some objects do stuff with viewUpdateUrl when we delete or create them)
		gViewStatus=newViewStatus;

		//traverse the old views, and compare to new
		$.each(oldViewStatus.views, function(viewId, view)
		{
			//deleted?
			//(changed stuff will also be deleted and recreated below)
			if (! (viewId in newViewStatus.views))
			{
				viewDOMdel(view);
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
					viewDOMadd(view);
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


function viewSetUrl(viewStatus)
{
	var hash=rison.encode(viewStatus);
	console.log("view changing url hash to: "+hash);
	jQuery.history.load(hash);
}

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
	viewSetUrl(viewStatus);	
}

/* creates a new view of specified type, and calls viewLoad to load the view in it.
	params:
		clear: set to true to delete all other main-windows before adding the new one.
		creator: element-object that was responsible for creating the view. Will be highlighted and scrolled to on close. (will create view.highlight)

	view:
		name: name of	 the view. e.g. 'users.list' (will load views/users/list.php)
		params: view specific parameters, used inside the view. (passed along without changing)
		mode:
			'main': add the view in the mainwindow and update viewPath.
			'popup': create a new popup window to load the view. 
			'existing': load view into an existing element id (see below)
		x,y: (for mode 'popup') coordinates for popup
		id: id of the element to load the view in (auto set in case of main and popup)
		highlight: a field to highlight during open and scroll-to after close

Loading views this way also ensures correct browser url and history updating.

Call viewClose to close the view.
*/
function viewCreate(params, view)
{
	//copy the current global viewstatus and change it to what we want
	var viewStatus={};
	$.extend( true, viewStatus, gViewStatus );

	//clear all main-windows?
	if (params.clear==true)
//	if (false)
	{
		//remove all mainviews
		$.each(gViewStatus.views,function(id,view)
		{
			if (viewStatus.views[id].mode=='main')
				delete viewStatus.views[id];
		});
	}

	//create new viewid
	viewStatus.count++;
	var id="view"+viewStatus.count;

	//add new view to viewStatus:
	viewStatus.views[id]={};
	$.extend(true, viewStatus.views[id], view);

	//add id field
	viewStatus.views[id].id=id;

	//highlight a creator?
	if (params.creator)
	{
		//TODO: change this system?
		$(params.creator).addClass(id);
		viewStatus.views[id].highlight="."+id;
	}
	
	viewSetUrl(viewStatus);
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
	$(".viewError", parent).text("");
	$(".ui-state-error", parent).removeClass("ui-state-error");

	if (result!=null)
	{
		if ('error' in result)
		{
			//show in html element?
			if ($(".viewError", parent).size()!=0)
			{
				$(".viewError", parent).text(result.error.message);
				$(".viewError", parent).addClass("ui-state-error");

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
				$(parent).autoFindField(meta, result.error.fields)
					.addClass("ui-state-error").focus();
			}
			return(true);
		}
	}
	return(false);
}

//reset viewpath click handlers and visuals
function viewPathUpdate()
{
	//only the last title is the active one so it shouldnt be clickable
	$("#viewPath .viewTitle").addClass("viewTitleHistory");
	$("#viewPath .viewTitle:last").removeClass("viewTitleHistory");

	//only the last view should be visible
	$("#views .viewMain:last").show();
	$("#views .viewMain:last").prev().hide();

	//when clicking history items, remove the views on the right of it
	$(".viewTitle").unbind();
	$(".viewTitleHistory").click(function(){
		//copy the current global viewstatus and expand it with this new view
		var viewStatus={};
		$.extend( true, viewStatus, gViewStatus );
		//remove everything on the right of us
		$(this).nextAll().each(function()
		{
			console.log("deleting",this);
			delete viewStatus.views[$(this).attr("viewId")];
		});
		viewSetUrl(viewStatus);
	});
}

//adds a new view to the DOM tree
function viewDOMadd(view)
{
	if (view.highlight)
		$(view.highlight).addClass("ui-state-highlight");

	
	if (view.mode=='main')
	{
		//add title to path
		var titleDiv=$("<div>");
		titleDiv.addClass("viewTitle");
		titleDiv.attr("id",view.id+"Title");
		titleDiv.attr("viewId",view.id);
		titleDiv.text("(loading...)");
		$("#viewPath").append(titleDiv);
		
		var viewDiv=$("<div>");
		viewDiv.addClass("ui-widget-content");
		viewDiv.addClass("viewMain");
		viewDiv.attr("id",view.id);
		viewDiv.addClass("autoRefresh");
		$("#views").append(viewDiv);

		viewPathUpdate();
		
	}
	else if (view.mode=='popup')
	{
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
				//NOTE: this "loops": the url will be updated, triggering a history event. then the open views will be compared to the wanted views. views that are popups will be deleted by calling this close function. shouldnt be a problem, since we are already gone by the time this happens.
				viewClose(view);
			}
		});
		
	}
	else
	{
		console.error("viewCreate: unknown view mode",view);
	}
}

//deletes a view from the DOM-tree in the correct way 
function viewDOMdel(view)
{
	if (view.mode=='popup')
	{
		var dialogDiv=$("#"+view.id).parent();
		dialogDiv.dialog('close'); //will delete itself
	}
	else if (view.mode=='main')
	{
		$("#"+view.id).remove();
		$("#"+view.id+"Title").remove();
		viewPathUpdate();
	}
	else //mode existing or main
	{
		//just clear it
		$("#"+view.id).unbind();
		$("#"+view.id).empty();
	}

	//remove highlight and scroll to it?
	if ($(view.highlight).length!=0)
	{
		$("body").scrollTop($(view.highlight).offset().top-100);
		$(view.highlight).removeClass("ui-state-highlight");
		//NO: goes wrong when adding stuff to formlists
		//$(view.highlight).effect('highlight',2000);

	}

}

/** Called by the view to indicate its ready and set some final options like title. And do things like resizing.
 */
function viewReady(params)
{
	
	if (params.view.mode=='popup')
	{
		var viewDiv=$("#"+params.view.id);
		var dialogDiv=viewDiv.parent();

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
	else if (params.view.mode=='main')
	{
		var viewTitleDiv=$("#"+params.view.id+"Title");
		viewTitleDiv.text(params.title+" » ");
	}
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



//send a refresh event to all .autoRefresh classes.
function viewRefresh()
{
	console.debug("Triggering refresh");
	$(".autoRefresh").trigger('refresh');

}


