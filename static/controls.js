

//////////////////////////////////////////////////////////////////////////////////////////
//base-class for all controllers
//usually the constructors in the subclass do all the work.
/* 
params:
	view:                view to operate on. view.id is used to determine jquery this.context.
	class:               rpc-class-name to call (used to fill in default values)
	get_meta: 	         rpc-method called to get metadata (default: class+".get_meta")
	get_data: 	         rpc-method called to get data (default: class+".get_data")
	put_data:            rpc-method called to put data (default: class+".delete")
	delete:            rpc-method called to delete data (default: class+".delete")
	get_all:             rpc-method called to get all data (default: class+".get_all)
	title:               title to set after get_data. (will be processed by format())

Other items in params documented in the subclasses below.

*/
function ControlBase(params)
{
	//constructor
	this.params=params;
	this.context=$("#"+params.view.id);
	this.debug_txt=params.view.id+" "+params.view.name+" ";

	//fill in some paramaters automaticly with defaults?
	if ('class' in params)
	{
		if (!('get_meta' in params))
			params.get_meta=params.class+".get_meta";

		if (!('get_data' in params))
			params.get_data=params.class+".get_data";

		if (!('put_data' in params))
			params.put_data=params.class+".put_data";

		if (!('delete' in params))
			params.delete=params.class+".delete";

		if (!('get_all' in params))
			params.get_all=params.class+".get_all";
	}

	if (!('title' in params))
		params.title="Untitled "+params.view.id;
}

/**
 Substitute macros found in text with data.

 Example: format("your name is {name}", { 'name': 'foobs' })
 Returns: "your name is foobs"
*/
ControlBase.prototype.format=function(txt, data)
{
	var key;
	var ret=txt;
	while(matches=ret.match(/\{\w*\}/))
	{
		key=matches[0].substr(1,matches[0].length-2);
		//console.log("found ", key);
		if (key in data)
		{
			ret=ret.replace(matches[0], data[key]);
		}
		else
		{
			ret=ret.replace(matches[0], "");
		}
	}

	return(ret)
}


//////////////////////////////////////////////////////////////////////////////////////////
//form controller
/*
params:
	(look in the baseclass for the basic documentation)

	get_meta_params      parameters to pass to get_meta (default: view.params)
	get_data_params      parameters to pass to get_data (default: view.params)
	put_data_params      parameters to pass to put_data (default: view.params)
	delete_params      parameters to pass to put_data (default: view.params)
	close_after_safe     close the view after succesfully saving the data
	put_data_result		 called with results of put data 
	get_data_result		 called with results of get data 
	get_meta_result		 called with results of get data 
	delete_result		 called with results of del

*/
function ControlForm(params)
{
	ControlBase.call(this,params);

	if (!('get_meta_params' in params))
		params.get_meta_params=params.view.params;

	if (!('get_data_params' in params))
		params.get_data_params=params.view.params;

	if (!('put_data_params' in params))
		params.put_data_params=params.view.params;

	if (!('delete_params' in params))
		params.delete_params=params.view.params;

	if (!('close_after_save' in params))
		params.close_after_save=true;

	if (! params.get_data_result)
		params.get_data_result=function(){};

	if (! params.put_data_result)
		params.put_data_result=function(){};

	if (! params.get_meta_result)
		params.get_meta_result=function(){};

	if (! params.delete_result)
		params.delete_result=function(){};

	this.get_meta();
}
ControlForm.prototype=Object.create(ControlBase.prototype);


//gets metadata for this form and fills in metadata in the specified this.context
//if all goes well, get_data will be called.
ControlForm.prototype.get_meta=function()
{	
	//get meta data
	this.meta={};
	rpc(this.params.get_meta, 
		this.params.get_meta_params,
		$.proxy(this.get_meta_result, this),
		this.debug_txt+"form getting meta data"
	);
}

ControlForm.prototype.get_meta_result=function(result)
{
	this.params.get_meta_result(result);

	if (viewShowError(result, this.context, this.meta))
		return;
	
	if (!('data' in result))
		return;

	this.meta=result['data'];
	$(this.context).autoMeta(this.meta);

	this.attach_event_handlers();	
	this.get_data();
}

//gets data from the rpc server and fills in the form
ControlForm.prototype.get_data=function()
{
	//enough parameters to get the data?
	if (this.params.get_data && this.params.get_data_params && Object.keys(this.params.get_data_params).length)
	{
		//get data
		rpc(
			params.get_data, 
			params.get_data_params,
			$.proxy(this.get_data_result,this),
			this.debug_txt+"getting form data"
		);
	}
	else
	{
		//NOTE:not loading data, we still call get_data_result with an empty result.
		this.get_data_result({});
	}
}

ControlForm.prototype.get_data_result=function(result)
{
	this.params.get_data_result(result);

	// $(".controlOnClickSave", this.context).prop("disabled", false);
	if (('data' in result) && (result.data != null) )
	{
		$(this.context).autoPut(this.meta, result.data);
	}
	
	this.focus();

	viewShowError(result, this.context, this.meta);

	viewReady({
		'view': this.params.view,
		'title': this.format(this.params.title, result)
	});

}


ControlForm.prototype.attach_event_handlers=function()
{
	var this_control=this;
	var context=this.context;

	//create an add-handler to add items to lists
	$(".controlOnClickListAdd", context).off().click(function(){
		//find the clicked list element, and the source element of the list
		var clicked_element=$(this, context).closest(".autoListItem, .autoListSource",context);
		
		if (clicked_element.length==0)
			return;

		var source_element=clicked_element.parent().children(".autoListSource");
		
		var add_element=autoListClone(source_element);

        if (clicked_element.hasClass("autoListSource"))
			add_element.insertBefore(clicked_element);
		else
			add_element.insertAfter(clicked_element);
		
	});
	
	//create an auto-add handler if the source-element of a list is focussed
	$(".controlOnFocusListAdd :input", context).off().focus(function(){
		var changed_element=$(this, context).closest(".autoListSource, .autoListItem", context);
        if (changed_element.hasClass("autoListSource"))
        {
			var add_element=autoListClone(changed_element);
			add_element.insertBefore(changed_element);
			$('.autoGet[_key="'+$(this).attr("_key")+'"]', add_element).focus();
        }
	});
	
	//create a handler to delete a list item
	$(".controlOnClickListDel", context).off().click(function()
	{
		var clicked_element=$(this, context).closest(".autoListItem",context);
        if (clicked_element.hasClass("autoListItem"))
		{
			$(this).confirm(function()
			{
				clicked_element.hide('fast',function()
				{
					clicked_element.remove();
				});
			});
		}
	});
	
	//make lists sortable
	$(".controlListSortable", context).off().sortable({
		placeholder: ".tempateSortPlaceholder",
		handle: ".controlOnDragSort",
		cancel: ".autoListSource",
		items:"> .autoListItem",
		forceHelperSize: true,
		forcePlaceholderSize: true
	});


	$(".controlOnClickSave", context).off().click(function()
	{
		this_control.put_data();
	});

	//pressing enter will also save:
	$(context).off().bind('keypress', function(e) 
	{
		if (e.keyCode==$.ui.keyCode.ENTER && e.target.nodeName.toLowerCase()!="textarea")
		{
			this_control.put_data();
		}
	});
	
	$(".controlOnClickDel", context).off().click(function() 
	{
		$(this).confirm(function() {
			this_control.delete();
		});
	});

	$(".controlOnClickCancel", context).off().click(function()
	{
		viewClose(this_control.params.view);
	});
}


//focus the correct input field
ControlForm.prototype.focus=function()
{
	if (this.params.view && this.params.view.focus)
		$(this.context).autoFindElement(this.meta, this.params.view.focus).focus();
	else if (this.params.default_focus)
		$(this.context).autoFindElement(this.meta, this.params.default_focus).focus();
	else
		$(".controlDefaultFocus", this.context).focus();
}


//save the form data by calling the put_data rpc function
ControlForm.prototype.put_data=function()
{

	//are there put_data_params that we should COPY?
	var put_data_params={};
	if (this.params.put_data_params)
		put_data_params=jQuery.extend(true, {}, this.params.put_data_params); //COPY, and not by reference!

	//get the data and store it into our local put_data_params
	$(this.context).autoGet(this.meta, put_data_params);

	//call the put_data function on the rpc server
	rpc(
		this.params.put_data,
		put_data_params,
		$.proxy(this.put_data_result, this),
		this.debug_txt+"form putting data"
	);
}

ControlForm.prototype.put_data_result=function(result)
{
	this.params.put_data_result(result);

	if (!viewShowError(result, this.context, this.meta) && (this.params.close_after_save))
		viewClose(this.params.view);

	$(".view").trigger('refresh');
	
}

//delete the item instead of saving it
ControlForm.prototype.delete=function()
{
	rpc(
		this.params.delete, 
		this.params.delete_params,
		$.proxy(this.delete_result, this),
		this.debug_txt+"form deleting item"
	);
}

ControlForm.prototype.delete_result=function(result)
{
	this.params.delete_result(result);
	if (!viewShowError(result, this.context, this.meta))
	{
		$(".view").trigger('refresh');

		if (this.params.close_after_save)
			viewClose(this.params.view);
	}
}


//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//list controller
/*
params:
	(look in the baseclass for the basic documentation)

	get_meta_params      parameters to pass to get_meta (default: view.params)
	get_data_params      parameters to pass to get_data (default: view.params)
	put_data_params      parameters to pass to put_data (default: view.params)
	delete_params      parameters to pass to put_data (default: view.params)
	close_after_safe     close the view after succesfully saving the data
	put_data_result		 called with results of put data 
	get_data_result		 called with results of get data 
	get_meta_result		 called with results of get data 
	delete_result		 called with results of del

*/
function ControlList(params)
{
	ControlBase.call(this,params);

	if (!('get_meta_params' in params))
		params.get_meta_params=params.view.params;

	if (!('get_data_params' in params))
		params.get_data_params=params.view.params;

	if (!('put_data_params' in params))
		params.put_data_params=params.view.params;

	if (!('delete_params' in params))
		params.delete_params=params.view.params;

	if (!('close_after_save' in params))
		params.close_after_save=true;

	if (! params.get_data_result)
		params.get_data_result=function(){};

	if (! params.put_data_result)
		params.put_data_result=function(){};

	if (! params.get_meta_result)
		params.get_meta_result=function(){};

	if (! params.delete_result)
		params.delete_result=function(){};

	this.get_meta();
}


ControlList.prototype=Object.create(ControlBase.prototype);







function controlList(params)
{
	var meta={};
	var context=$("#"+params.view.id);
	var autoListsource_element=$(".autoListSource:first",context);
	var beginLength=autoListsource_element.parent().children().length;

	this.debug_txt=params.view.id+" "+params.view.name+" ";

	////// GENERIC LIST STUFF
	
	//getParams can be changed by clicking sort colums, and by search queries etc
	var getParams={};
	if (params.getDataParams)
		getParams=jQuery.extend(true, {}, params.getDataParams); 
	
	var edit=function(event)
	{
		var listParent=$(this).closest(".autoListItem[_index], .autoListSource[_index]",context)	;
		
		var element=$(this);
		var id=listParent.attr("_id");
		var index=listParent.attr("_index");
		element.addClass("ui-state-highlight");
		
		
		//create the view to edit the clicked item
		var editView={};
		$.extend( editView, params.editView );
		if (! editView.params)
			editView.params={};
		editView.focus=$(element).autoFindKeys(meta);
		if (typeof id != "undefined")
			editView.params[index]=id;
		editView.x=event.clientX;
		editView.y=event.clientY;
		viewCreate(
			{
				creator: element
			},
			editView);
	};

	var del=function(event)
	{
		var listParent=$(this).closest(".autoListItem",context);
		var id=listParent.attr("_id");
		var index=listParent.attr("_index");

		$(this).confirm(function()
		{
			var rpcParams={};
			rpcParams[index]=id;
			rpc(
				params.delData,
				rpcParams,
				function(result)
				{
					if (!viewShowError(result, listParent, meta))
					{
						$(".view").trigger('refresh');
					}
				},
				this.debug_txt+"list deleting item"
			);
		});
	};

	function getData(update)
	{

		//get data
		rpc(
			params.getData,
			getParams,
			function(result)
			{
				viewShowError(result, context, meta);
			
				if ('data' in result)
				{
					dataConv.List.put(
							autoListsource_element, //element
							{ meta: meta },  		//meta
							'',						//keyStr
							result.data,			//value	
							{						//settings
								update: update,
								showChanges: update
							}		
					);
				}
				
	  			$(".controlOnClickDel", context).unbind('click');
				$(".controlOnClickDel", context).click( del);
				$(".controlOnClickEdit", context).unbind( 'click');
				$(".controlOnClickEdit", context).click( edit);

				if (!update)
				{
					params.loadCallback(result);
				}
			},
			this.debug_txt+"list getting data, update="+update
		);
	}

	$(context).bind('refresh',function()
	{
		//console.log("reresh!!");
		getData(true);

	});

	//get meta
	rpc(
		params.getMeta,
		params.getMetaParams,
		function(result)
		{
			if (!viewShowError(result, context, meta))
			{
				meta=result['data'];
				//add real input to autoMeta divs. 
				$(context).autoMeta(meta);
				
				//make sure autoListItems are recognised (normally autoMeta does this when it encounters and array or hash type)
	//			$(".autoListSource:first", context).addClass("autoListItem");
				
				getData(false);
			}
		},
		this.debug_txt+"list getting meta data"		

	)

	
	/// ORDER STUFF
	
	//what is the current selected sorting column?
	if ($(".controlOrderAsc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".controlOrderAsc").attr("_key")]=1;
	}
	else if ($(".controlOrderDesc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".controlOrderDesc").attr("_key")]=-1;
	}

	$(".controlOnClickOrder", context).click(function()
	{
		getParams.sort={};
		
		if ($(this).hasClass("controlOrderAsc"))
		{
			$(".controlOrderAsc",context).removeClass("controlOrderAsc");
			$(".controlOrderDesc",context).removeClass("controlOrderDesc");
			getParams.sort[$(this).attr("_key")]=-1;
			$(this).addClass("controlOrderDesc");
		}
		else
		{
			$(".controlOrderAsc",context).removeClass("controlOrderAsc");
			$(".controlOrderDesc",context).removeClass("controlOrderDesc");
			getParams.sort[$(this).attr("_key")]=1;
			$(this).addClass("controlOrderAsc");
		}
		
		getData(false);
	});
	

	/// FILTER STUFF
	//handle filtering 
	$(".controlOnChangeFilter", context).keyup(function()
	{
		filterPrevious=$(this).val();
		
		if (!getParams.filter)
			getParams.filter={};
		
		if ($(this).val()!="")
		{
			if (getParams.filter[$(this).attr("_key")]==$(this).val())
				return;
			
			getParams.filter[$(this).attr("_key")]=$(this).val();
			getData(false);
		}
		else
		{
			if (!($(this).attr("_key") in getParams.filter))
				return;
			
			delete getParams.filter[$(this).attr("_key")];
			getData(false);
		}
	});
	
	//set default focus
	$(".controlSetFocus", context).focus();

	//enable endless scrolling?
	if (params.endlessScrolling && ('limit' in getParams))
	{
		var endlessUpdating=false;
		$(context).on("view.scrolledBottom",function()
		{
			if (endlessUpdating)
				return;
			
			endlessUpdating=true;
			
			var endlessParams={};
			$.extend( endlessParams, getParams );
			
			if (!('offset' in endlessParams))
				endlessParams.offset=0;
			
			endlessParams.offset+=$(autoListsource_element).parent().children().length-beginLength;
			
			logDebug("endless scroll offset is ",endlessParams.offset);

			rpc(
				params.getData,
				endlessParams,
				function(result)
				{
					dataConv.List.put(
							autoListsource_element, //element
							{ meta: meta },  		//meta
							'',						//keyStr
							result.data,			//value	
							{						//settings
								noRemove: true
							}		
					);
					endlessUpdating=false;
				},
				this.debug_txt+"list getting data (scrolling)"
			);
		});
	}
			
}

