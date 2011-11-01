
//counter to create unique id's for view-stuff
var gViewCount=0;

//array containing the data of all views. 
//views will be created and destroyed by comparing this to the url hash
var gViews={};

//initialize view history tracker
$(document).ready(function()
{
	$.history.init(function(hash){
		if (hash == "") 
			hash="{}";

		// hash changed, update views:
		console.log("view detected new url hash", hash);
		
		var newViews=JSON.parse(hash);

		//traverse the old views, and compare to new
		$.each(gViews, function(viewSelector, view)
		{
			//deleted?
			//(changed stuff will also be deleted and recreated below)
			if (! viewSelector in newViews) 
			{
				console.log("deleting: "+viewSelector);
				//if its a popup, delete it properly
				if (view.create=='popup')
				{
					var dialogDiv=$(viewSelector).parent();
					dialogDiv.dialog('close'); //will delete itself
				}
				else
				//just clear it
				{
					$(viewSelector).unbind();
					$(viewSelector).empty();
				}
			}
		});

		//traverse the new views, and compare to old
		$.each(newViews, function(viewSelector, view)
		{
			//new or changed
			if (
				(! (viewSelector in gViews)) || //new
				gViews[viewSelector].name!=view.name || //different view name or params?
				gViews[viewSelector].viewParams.join('')!=view.viewParams.join('') 
			)
			{
				//viewSelector doesnt exist yet?
				if ($(viewSelector).length==0)
				{
					console.log("creating: "+viewSelector);
					
					//create popup?
					if (view.create=='popup')
					{
						viewCreatePopup(viewSelector, view.x, view.y, view.highlight);
					}
					//doesnt exist and cant create it :(
					else
					{
						console.error("cant load view, element not found", viewSelector, view);
					}						
				}

				console.log("loading: "+viewSelector);

				//store viewId in params, so that the view knows what its element is
				var viewParams={
					element:viewSelector
				};
				$.extend( viewParams, view.viewParams );
				
				//(re)load the view
				viewLoad(
					viewSelector,
					view.name,
					viewParams
				);
			}
		});
		
		//store the updated view state
		gViews=newViews;
	});
});

/* creates a new view of specified type, and calls viewLoad to load the view in it.
	name: name of the view. e.g. 'users.list' (will load views/users/list.php)
	viewParams: view specific parameters, used inside the view. (is passed along almost unchanged, only the selector of the container is added so the view can operate in that scope)
	mode:
		'main': load the view in the mainwindow. (TODO:deletes any open stacked windows)
		'popup': create a new popup window to load the view. 
		'existing': load view into an existing selector (see below)
		TODO:'stack': create new view to stack on top of mainwindow or other stacked views. This way the main window stays intact, so that when you close the stacked window and give the user the feeling he is back in the previous screen. This also highlights all the changes he made.
		
	x,y: (for mode 'popup') coordinates for popup
	selector: (for mode 'existing'): global uniq jquery selector string to load the view in (e.g. '#view321bla')
	creator: (optional for mode 'popup'): element-object that was responsible for creating the popup. Will be used for popups to highlight the object. 


*/
function viewCreate(params)
{
	//copy the current global viewstatus and expand it with this new view
	var views={};
	$.extend( views, gViews );
	
	var viewSelector="";

	if (params.mode=='popup')
	{
		gViewCount++;
		viewSelector="#view"+gViewCount;
		views[viewSelector]={};

		views[viewSelector].x=params.x;
		views[viewSelector].y=params.y;
		views[viewSelector].create="popup";
		
		if (params.creator)
		{
			//TODO: create better method that doesnt need adding a class?
			$(params.creator).addClass("view"+gViewCount);
			views[viewSelector].highlight=".view"+gViewCount;
		}
		
	}
	else if (params.mode=='main')
	{
		viewSelector="#viewMain";
		views[viewSelector]={};
	}
	else if (params.mode=='existing')
	{
		viewSelector=outerParams.selector;
		views[viewSelector]={};
	}
	else
	{
		console.error("Unknown view mode! ",outerParams);
		return;
	}
	
	//set common options
	views[viewSelector].name=params.name;
	views[viewSelector].viewParams=params.viewParams;
	
	//now copy the new views array to the browser url, triggering the actual changes:
	var hash=JSON.stringify(views);
	console.log("view changing url hash to: "+hash);
	jQuery.history.load(hash);
	
}


//closes the specified view
function viewClose(element)
{
	
}

/*** Shows error and highlights field
 * Returns false if there are no errors to report
 */
function viewShowError(meta, result, parent)
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
				field=$(".autoGet", parent).autoFindField(meta, result.error.fields);
				$(field).addClass("ui-state-error").focus();
			}
			return(true);
		}
	}
	return(false);
}

//creates an empty popup window. dont call directly, used internally
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
		}
	});
}

//loads a view in the specified element
//(dont call this directly, use viewCreate instead, to update browser history)
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


