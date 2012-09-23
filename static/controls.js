/*
 Substitute macros found in text with data.

 Example: format("your name is {name}", { 'name': 'foobs' })
 Returns: "your name is foobs"
*/
function format(txt, data)
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
//base-class for all controllers
//usually the constructors in the subclass do all the work.
/* 
params:
	view:                view to operate on. view.id is used to determine jquery context.
	class:               rpc-class-name to call (used to fill in default values)
	get_meta: 	         rpc-method called to get metadata (default: class+".get_meta")
	get_data: 	         rpc-method called to get data (default: class+".get_data")
	put_data:            rpc-method called to put data (default: class+".del_data")
	del_data:            rpc-method called to delete data (default: class+".del_data")
	get_all:             rpc-method called to get all data (default: class+".get_all)

Other items in params documented in the subclasses below.

*/
function ControlBase(params)
{
	//constructor
	this.params=params;
	this.context=$("#"+params.view.id);
	this.debugTxt=params.view.id+" "+params.view.name+" ";

	//fill in some paramaters automaticly with defaults?
	if ('class' in params)
	{
		if (!('get_meta' in params)
			params.get_meta=params.class+".get_meta";

		if (!('get_data' in params)
			params.get_data=params.class+".get_data";

		if (!('put_data' in params)
			params.put_data=params.class+".put_data";

		if (!('del_data' in params)
			params.del_data=params.class+".del_data";

		if (!('get_all' in params)
			params.get_all=params.class+".get_all";
	}
}


//////////////////////////////////////////////////////////////////////////////////////////
//form controller
/*
params:
	(look in the baseclass for the basic documentation)

	get_meta_params      parameters to pass to get_meta (default: undefined)
	get_data_params      parameters to pass to get_data (default: view.params)
	put_data_params      parameters to pass to put_data (default: view.params)
	del_data_params      parameters to pass to put_data (default: view.params)

*/
function ControlForm(params)
{
	ControlBase.call(this,params);

	if (!('get_meta_params' in params)
		params.get_data_params=params.view.params;

	if (!('get_data_params' in params)
		params.get_data_params=params.view.params;

	this.get_meta();
}
ControlForm.prototype=Object.create(ControlBase.prototype);

ControlForm.prototype.attach_event_handlers=function()
{
	var context=this.context; 

	//create an add-handler to add items to lists
	$(".controlOnClickAdd", context).click(function(){
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
	$(".controlOnFocusAdd :input", context).focus(function(){
		var changed_element=$(this, context).closest(".autoListSource, .autoListItem", context);
        if (changed_element.hasClass("autoListSource"))
        {
			var add_element=autoListClone(changed_element);
			add_element.insertBefore(changed_element);
			$('.autoGet[_key="'+$(this).attr("_key")+'"]', add_element).focus();
        }
	});
	

	//create a handler to delete a list item
	$(".controlOnClickDel", context).click(function()
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
	$(".controlSortable", context).sortable({
		placeholder: ".tempateSortPlaceholder",
		handle: ".controlOnDragSort",
		cancel: ".autoListSource",
		items:"> .autoListItem",
		forceHelperSize: true,
		forcePlaceholderSize: true
	});
}

//focus the correct input field
ControlForm.prototype.focus=function()
{
	if (this.params.view && this.params.view.focus)
		$(this.context).autoFindElement(this.meta, this.params.view.focus).focus();
	else if (this.params.defaultFocus)
		$(this.context).autoFindElement(this.meta, this.params.defaultFocus).focus();

	//elements that have controlSetFocus always overrule the focus:
	$(".controlSetFocus", this.context).focus();
}

//gets 
ControlForm.prototype.get_data=function()
{

}

//gets metadata for this form and fills in metadata in the specified context
//if all goes well, getData is called.
ControlForm.prototype.get_meta=function()
{
	//disable submit button while loading
	$(".controlOnClickSave", context).prop("disabled", true);
	
	//get meta data
	this.meta={};
	rpc(
		this.params.get_meta, 
		this.params.get_meta_params,
		function(result)
		{
			
			if (viewShowError(result, this.context, this.meta))
				return;
			
			if (!('data' in result))
				return;

			this.meta=result['data'];
			$(this.context).autoMeta(this.meta);

			this.attachEventHandlers();			
			
			if (params.getData && params.getDataParams && Object.keys(params.getDataParams).length)
				{
				//get data
				rpc(
					params.getData, 
					params.getDataParams,
					function(result)
					{
						$(".controlOnClickSave", context).prop("disabled", false);

						if (('data' in result) && (result.data != null) )
						{
							$(context).autoPut(meta, result.data);
						}
						
						controlFormFocus();

						if (viewShowError(result, context, meta))
						{
							if (params['errorCallback'])
								params['errorCallback'](result);
						}
						else
						{
							if (params['loadCallback'])
								params['loadCallback'](result);
						}
						

					},
					debugTxt+"getting form data"
				);
			}
			//when not loading data, dont forget to call the loadCallback:
			else
			{
				$(".controlOnClickSave", context).prop("disabled", false);

				controlFormFocus();

				if (params['loadCallback'])
					params['loadCallback']({}); //pass an empty result

			}
		},
		debugTxt+"form getting meta data"
	);
	
	//save 
	var save=function()
	{
		$(".controlOnClickSave", context).prop("disabled", true);

		//are there putParams that we should COPY to putData
		var putParams={};
		if (params.putDataParams)
			putParams=jQuery.extend(true, {}, params.putDataParams); //COPY, and not by reference!

		//get the data
		$(context).autoGet(meta, putParams);

		//put data
		rpc(
			params.putData,
			putParams,
			function(result)
			{
				$(".controlOnClickSave", context).prop("disabled", false);
				
				viewShowError(result, context, meta);

				if (result)
				{
					if ('error' in result)
					{
						if (params['errorCallback']!=null)
							params['errorCallback'](result);
						
						return;
					}
				}


				viewRefresh();

				//all ok, call save callback?
				if (params['saveCallback']!=null)
					params['saveCallback'](result);
				
				//all ok, close window
				if (params.closeAfterSave)
					viewClose(params.view);
			},
			debugTxt+"form putting data"
		);
	};

	var del=function()
	{
		$(this).confirm(function()
		{
			rpc(
				params.delData, 
				params.getDataParams,
				function(result)
				{
					if (!viewShowError(result, this, meta))
					{
						viewRefresh();
						if (params.closeAfterSave)
							viewClose(params.view);
					}
				},
				debugTxt+"form deleting item"
			);
		});
	}
	
	
	$(".controlOnClickSave", context).click(save);

	//pressing enter will also save:
	$(context).bind('keypress', function(e) {
		
		if (e.keyCode==$.ui.keyCode.ENTER && e.target.nodeName.toLowerCase()!="textarea")
		{
			save();
		}
	});
	
	$(".controlOnClickDel", context).click(del);


	$(".controlOnClickCancel", context).click(function()
			{
				viewClose(params.view);
			});
}

//////////////////////////////////////////////////////////////////////////////////////////
function controlList(params)
{
	var meta={};
	var context=$("#"+params.view.id);
	var autoListsource_element=$(".autoListSource:first",context);
	var beginLength=autoListsource_element.parent().children().length;

	var debugTxt=params.view.id+" "+params.view.name+" ";

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

//		if (!rowElement.hasClass("autoListSource"))
		{
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
							viewRefresh();
						}
					},
					debugTxt+"list deleting item"
				);
			});
		}
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
			debugTxt+"list getting data, update="+update
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
		debugTxt+"list getting meta data"		

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
				debugTxt+"list getting data (scrolling)"
			);
		});
	}
			
}

