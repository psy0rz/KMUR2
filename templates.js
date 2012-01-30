//////////////////////////////////////////////////////////////////////////////////////////
function templateForm(params)
{
	var meta;
	var context=$("#"+params.view.id);
	
	//disable submit button while loading
	$(".autoClickSave", context).prop("disabled", true);
	
	//get meta data
	rpc(
		params.getMeta, 
		params.getMetaParams,
		function(result)
		{
			
			viewShowError(result, context, meta);

			meta=result['data'];
			$(".autoMeta", context).autoMeta(meta);

			//create an add-handler to add items to lists
			$(".autoClickAdd", context).click(function(){
				//find the clicked list element, and the source element of the list
				var clickedElement=$(this, context).closest(".autoListItem");
				
				//readonly?
				if (!clickedElement.hasClass("autoGet"))
					return;
				
				var sourceElement=clickedElement.parent().children(".autoListSource");
				var addElement=$(sourceElement).clone(true,true);
				addElement.removeClass("autoListSource");

				//workaround for bug http://stackoverflow.com/questions/742810/clone-isnt-cloning-select-values
				//http://bugs.jquery.com/ticket/1294
//				var selects = $(sourceElement).find("select");
	//	        $(selects).each(function(i) {
		//                var select = this;
		  //              $(addElement).find("select").eq(i).val($(select).val());
		    //    });

		        if (clickedElement.hasClass("autoListSource"))
					addElement.insertBefore(clickedElement);
				else
					addElement.insertAfter(clickedElement);
				
			});
			
			//create an auto-add handler if the source-element is changed
			$(".autoFocusAdd :input", context).focus(function(){
				var changedElement=$(this, context).closest(".autoListItem");
				//is this the source element?
				if (changedElement.hasClass("autoListSource"))
				{
					//create a new source element
					var addElement=$(changedElement).clone(true);
					changedElement.removeClass("autoListSource");
					addElement.insertAfter(changedElement);
				}
			});
			

			//add delete handlers for lists
			$(".autoClickDel", context).click(function()
			{		
				var clickedElement=$(this, context).closest(".autoListItem");
				if (!clickedElement.hasClass("autoListSource") && clickedElement.hasClass("autoGet"))
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
			$(".autoSort", context).sortable({
				placeholder: "autoSortPlaceholder",
				handle: ".autoClickSort",
				cancel: ".autoListSource",
				items:".autoGet",
				forceHelperSize: true,
				forcePlaceholderSize: true
			});
			
			//focus the correct input field
			if (params.view.params && params.view.params.focus)
				$(".autoGet", context).autoFindField(meta, params.view.params.focus).focus();
			else if (params.defaultFocus)
				$(".autoGet", context).autoFindField(meta, params.defaultFocus).focus();

			if (params['getData'])
			{
				//get data
				rpc(
					params.getData, 
					params.getDataParams,
					function(result)
					{
						$(".autoClickSave", context).prop("disabled", false);

						if (result.data)
						{
							$(".autoPut", context).autoPut(meta, result.data, {
								context: context
							});
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
					}
				);
			}
			//when not loading data, dont forget to call the loadCallback:
			else
			{
				$(".autoClickSave", context).prop("disabled", false);

				if (params['loadCallback'])
					params['loadCallback'](result);
			}
		}
	);
	
	//save 
	var save=function()
	{
		$(".autoClickSave", context).prop("disabled", true);

		//are there putParams that we should COPY to putData
		var putParams={};
		if (params.putDataParams)
			putParams=jQuery.extend(true, {}, params.putDataParams); //COPY, and not by reference!

		//get the data
		$(".autoGet", context).autoGet(meta, putParams, { 
			context: context 
		});

		//put data
		rpc(
			params.putData,
			putParams,
			function(result)
			{
				$(".autoClickSave", context).prop("disabled", false);
				
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

	
	$(".autoClickSave", context).click(save);
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

	////// GENERIC LIST STUFF
	
	//getParams can be changed by clicking sort colums, and by search queries etc
	var getParams={};
	if (params.getDataParams)
		getParams=jQuery.extend(true, {}, params.getDataParams); 
	
	var edit=function(event)
	{
		var listParent=$(this).closest(".autoListItem");
		var element=$(this);
		var id=listParent.attr("_value");
		element.addClass("ui-state-highlight");
		
		//determine the focus fields path
		var fields=[];
		if ($(this).attr("_key"))
			fields.unshift($(this).attr("_key"));
		
		$(this).parents("[_key]", listParent).each(function(index,element)
		{
			if ($(element).attr("_key")!="_id")
				fields.unshift($(element).attr("_key"));
		});

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
		var rowElement=$(this).parent(".autoListItem");
		var id=rowElement.attr("_value");
		if (!rowElement.hasClass("autoListSource"))
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
						if (!viewShowError(result, rowElement, meta))
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

				if (update)
				{
					//since its an update, dont get confused with the other autoput-list items
					$(".autoListSource:first", context).autoList(meta, result['data'], {
						updateOn:params.id,
						context: context
					});
				}
				else
				{
					//delete old list contents
					$(".autoListItem",context).not(".autoListSource").remove();
					$(".autoListSource:first", context).autoList(meta, result['data'], {
						context: context
					});
				}
					
				$(".autoClickDel", context).unbind('click');
				$(".autoClickDel", context).click( del);
				$(".autoClickEdit", context).unbind( 'click');
				$(".autoClickEdit", context).click( edit);

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
			$(".autoMeta", context).autoMeta(meta);
			
			//make sure autoListItems are recognised (normally autoMeta does this when it encounters and array or hash type)
			$(".autoListSource:first", context).addClass("autoListItem");
			
			getData(false);
		}
	)

	
	/// SORT STUFF
	
	//what is the current selected sorting column?
	if ($(".autoOrderAsc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".autoOrderAsc").attr("_key")]=1;
	}
	else if ($(".autoOrderDesc",context).length !=0)
	{
		getParams.sort={};
		getParams.sort[$(".autoOrderDesc").attr("_key")]=-1;
	}

	$(".autoOrder", context).click(function()
	{
		getParams.sort={};
		
		if ($(this).hasClass("autoOrderAsc"))
		{
			$(".autoOrderAsc",context).removeClass("autoOrderAsc");
			$(".autoOrderDesc",context).removeClass("autoOrderDesc");
			getParams.sort[$(this).attr("_key")]=-1;
			$(this).addClass("autoOrderDesc");
		}
		else
		{
			$(".autoOrderAsc",context).removeClass("autoOrderAsc");
			$(".autoOrderDesc",context).removeClass("autoOrderDesc");
			getParams.sort[$(this).attr("_key")]=1;
			$(this).addClass("autoOrderAsc");
		}
		
		getData(false);
	});
	

	/// FILTER STUFF
	//handle filtering 
	$(".autoFilterFocus", context).focus();

	$(".autoFilter", context).keyup(function()
	{
		if (!getParams.filter)
			getParams.filter={};
		
		if ($(this).val()!="")
			getParams.filter[$(this).attr("_key")]=$(this).val();
		else
			delete getParams.filter[$(this).attr("_key")];
		getData(false);
	});
	
}

