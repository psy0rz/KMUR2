//////////////////////////////////////////////////////////////////////////////////////////
function templateForm(params)
{
	var meta;
	var context=$("#"+params.view.id);
	
	//disable submit button while loading
	$(".templateOnClickSave", context).prop("disabled", true);
	
	//get meta data
	rpc(
		params.getMeta, 
		params.getMetaParams,
		function(result)
		{
			
			viewShowError(result, context, meta);

			meta=result['data'];
			$(context).autoMeta(meta);
			
			//create an add-handler to add items to lists
			$(".templateOnClickAdd", context).click(function(){
				//find the clicked list element, and the source element of the list
				var clickedElement=$(this, context).closest(".autoListItem, .autoListSource");
				
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
			$(".templateOnFocusAdd :input", context).focus(function(){
				var changedElement=$(this, context).closest(".autoListSource, .autoListItem");
		        if (changedElement.hasClass("autoListSource"))
		        {
					var addElement=autoListClone(changedElement);
					addElement.insertBefore(changedElement);
					$('.autoGet[_key="'+$(this).attr("_key")+'"]', addElement).focus();
		        }
			});
			

			//delete handlers for lists
			$(".templateOnClickDel", context).click(function()
			{
				var clickedElement=$(this, context).closest(".autoListItem");
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
			$(".templateSortable", context).sortable({
				placeholder: ".tempateSortPlaceholder",
				handle: ".templateOnDragSort",
				cancel: ".autoListSource",
				items:"> .autoListItem",
				forceHelperSize: true,
				forcePlaceholderSize: true
			});
			

			if (params['getData'])
			{
				//get data
				rpc(
					params.getData, 
					params.getDataParams,
					function(result)
					{
						$(".templateOnClickSave", context).prop("disabled", false);

						if (result.data)
						{
							$(context).autoPut(meta, result.data);
						}
						

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
						
						//focus the correct input field
						if (params.view.params && params.view.params.focus)
							$(context).autoFindElement(meta, params.view.params.focus).focus();
						else if (params.defaultFocus)
							$(context).autoFindElement(meta, params.defaultFocus).focus();
				
						//elements that have templateSetFocus always overrule the focus:
						$(".templateSetFocus", context).focus();

					}
				);
			}
			//when not loading data, dont forget to call the loadCallback:
			else
			{
				$(".templateOnClickSave", context).prop("disabled", false);

				if (params['loadCallback'])
					params['loadCallback'](result);
			}
		}
	);
	
	//save 
	var save=function()
	{
		$(".templateOnClickSave", context).prop("disabled", true);

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
				$(".templateOnClickSave", context).prop("disabled", false);
				
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

	
	$(".templateOnClickSave", context).click(save);

	//pressing enter will also save:
	$(context).bind('keypress', function(e) {
		
		if (e.keyCode==$.ui.keyCode.ENTER && e.target.nodeName.toLowerCase()!="textarea")
		{
			save();
		}
	});
}

//////////////////////////////////////////////////////////////////////////////////////////
function templateList(params)
{
	var meta={};
	var context=$("#"+params.view.id);
	var autoListSourceElement=$(".autoListSource:first",context);

	////// GENERIC LIST STUFF
	
	//getParams can be changed by clicking sort colums, and by search queries etc
	var getParams={};
	if (params.getDataParams)
		getParams=jQuery.extend(true, {}, params.getDataParams); 
	
	var edit=function(event)
	{
		var listParent=$(this).closest(".autoListItem[_id]")	;
		var element=$(this);
		var id=listParent.attr("_id");
		if (typeof id == "undefined")
			id='';
		element.addClass("ui-state-highlight");
		
		var fields=$(element).autoFindKeys(meta);
		
		//create the view to edit the clicked item
		var editView={};
		$.extend( editView, params.editView );
		if (! editView.params)
			editView.params={};
		editView.params.focus=fields;
		editView.params._id=id;
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
		var listParent=$(this).closest(".autoListItem");
		var id=listParent.attr("_id");

//		if (!rowElement.hasClass("autoListSource"))
		{
			$(this).confirm(function()
			{
				var rpcParams={};
				rpcParams[params.id]=id;
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

//				if (update)
//				{
//					//since its an update, dont get confused with the other autoput-list items
//					$(".autoListSource:first", context).autoList(meta, result['data'], {
//						indexKey:params.id,
//						context: context,
//						update:true,
//						showChanges:true
//					});
//				}
//				else
//				{
//					//delete old list contents
//					$(".autoListItem",context).not(".autoListSource").remove();
//					$(".autoListSource:first", context).autoList(meta, result['data'], {
//						indexKey:params.id,
//						updateOn:params.id,
//						context: context
//					});
//				}

				
				dataConv.array.put(
						autoListSourceElement, //element
						{ meta: meta },  		//meta
						'',						//keyStr
						result.data,			//value	
						{						//settings
							update: update,
							showChanges: update
						}		
				);
				
	  			$(".templateOnClickDel", context).unbind('click');
				$(".templateOnClickDel", context).click( del);
				$(".templateOnClickEdit", context).unbind( 'click');
				$(".templateOnClickEdit", context).click( edit);

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
			viewShowError(result, context, meta);

			meta=result['data'];
			//add real input to autoMeta divs. 
			$(context).autoMeta(meta);
			
			//make sure autoListItems are recognised (normally autoMeta does this when it encounters and array or hash type)
//			$(".autoListSource:first", context).addClass("autoListItem");
			
			getData(false);
		}
	)

	
	/// ORDER STUFF
	
	//what is the current selected sorting column?
	if ($(".templateOrderAsc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".templateOrderAsc").attr("_key")]=1;
	}
	else if ($(".templateOrderDesc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".templateOrderDesc").attr("_key")]=-1;
	}

	$(".templateOnClickOrder", context).click(function()
	{
		getParams.sort={};
		
		if ($(this).hasClass("templateOrderAsc"))
		{
			$(".templateOrderAsc",context).removeClass("templateOrderAsc");
			$(".templateOrderDesc",context).removeClass("templateOrderDesc");
			getParams.sort[$(this).attr("_key")]=-1;
			$(this).addClass("templateOrderDesc");
		}
		else
		{
			$(".templateOrderAsc",context).removeClass("templateOrderAsc");
			$(".templateOrderDesc",context).removeClass("templateOrderDesc");
			getParams.sort[$(this).attr("_key")]=1;
			$(this).addClass("templateOrderAsc");
		}
		
		getData(false);
	});
	

	/// FILTER STUFF
	//handle filtering 
	$(".templateOnChangeFilter", context).keyup(function()
	{
		if (!getParams.filter)
			getParams.filter={};
		
		if ($(this).val()!="")
			getParams.filter[$(this).attr("_key")]=$(this).val();
		else
			delete getParams.filter[$(this).attr("_key")];
		getData(false);
	});
	
	//set default focus
	$(".templateSetFocus", context).focus();

}

