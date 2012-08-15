//////////////////////////////////////////////////////////////////////////////////////////
function controlForm(params)
{
	var meta;
	var context=$("#"+params.view.id);
	
	//disable submit button while loading
	$(".controlOnClickSave", context).prop("disabled", true);
	
	//get meta data
	rpc(
		params.getMeta, 
		params.getMetaParams,
		function(result)
		{
			
			if (viewShowError(result, context, meta))
				return;
			
			if (!('data' in result))
				return;

			meta=result['data'];
			$(context).autoMeta(meta);
			
			//create an add-handler to add items to lists
			$(".controlOnClickAdd", context).click(function(){
				//find the clicked list element, and the source element of the list
				var clickedElement=$(this, context).closest(".autoListItem, .autoListSource",context);
				
				if (clickedElement.length==0)
					return;
				
				var sourceElement=clickedElement.parent().children(".autoListSource");
				
				var addElement=autoListClone(sourceElement);

		        if (clickedElement.hasClass("autoListSource"))
					addElement.insertBefore(clickedElement);
				else
					addElement.insertAfter(clickedElement);
				
			});
			
			//create an auto-add handler if the source-element is focussed
			$(".controlOnFocusAdd :input", context).focus(function(){
				var changedElement=$(this, context).closest(".autoListSource, .autoListItem", context);
		        if (changedElement.hasClass("autoListSource"))
		        {
					var addElement=autoListClone(changedElement);
					addElement.insertBefore(changedElement);
					$('.autoGet[_key="'+$(this).attr("_key")+'"]', addElement).focus();
		        }
			});
			

			//delete handlers for lists
			$(".controlOnClickDel", context).click(function()
			{
				var clickedElement=$(this, context).closest(".autoListItem",context);
		        if (clickedElement.hasClass("autoListItem"))
				{
					$(this).confirm(function()
					{
						clickedElement.hide('fast',function()
						{
							clickedElement.remove();
						});
					});
				}
			});
			
			//make stuff sortable
			$(".controlSortable", context).sortable({
				placeholder: ".tempateSortPlaceholder",
				handle: ".controlOnDragSort",
				cancel: ".autoListSource",
				items:"> .autoListItem",
				forceHelperSize: true,
				forcePlaceholderSize: true
			});

			
			function controlFormFocus()
			{
				//focus the correct input field
				if (params.view && params.view.focus)
					$(context).autoFindElement(meta, params.view.focus).focus();
				else if (params.defaultFocus)
					$(context).autoFindElement(meta, params.defaultFocus).focus();
		
				//elements that have controlSetFocus always overrule the focus:
				$(".controlSetFocus", context).focus();
				
			}

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
						

					}
				);
			}
			//when not loading data, dont forget to call the loadCallback:
			else
			{
				$(".controlOnClickSave", context).prop("disabled", false);

				controlFormFocus();

				if (params['loadCallback'])
					params['loadCallback'](result);
				

			}
		}
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
			}
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
				}
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
	var autoListSourceElement=$(".autoListSource:first",context);
	var beginLength=autoListSourceElement.parent().children().length;

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
					}
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
							autoListSourceElement, //element
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
			}
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
		}
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
			
			endlessParams.offset+=$(autoListSourceElement).parent().children().length-beginLength;
			
			logDebug("endless scroll offset is ",endlessParams.offset);

			rpc(
				params.getData,
				endlessParams,
				function(result)
				{
					dataConv.List.put(
							autoListSourceElement, //element
							{ meta: meta },  		//meta
							'',						//keyStr
							result.data,			//value	
							{						//settings
								noRemove: true
							}		
					);
					endlessUpdating=false;
				}
			);
		});
	}
			
}

