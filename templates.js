//////////////////////////////////////////////////////////////////////////////////////////
function templateForm(params)
{
	var meta;
	
	//disable submit button while loading
	$(".autoClickSave", params.element).prop("disabled", true);
	
	//get meta data
	rpc(
		params.getMeta, 
		params.viewParams,
		function(result)
		{
			meta=result['data'];
			$(".autoMeta", params.element).autoMeta(meta);

			//create an add-handler to add items to lists
			$(".autoClickAdd", params.element).click(function(){
				//find the clicked list element, and the source element of the list
				var clickedElement=$(this, params.element).closest(".autoListItem");
				
				//readonly
				if (!clickedElement.hasClass("autoGet"))
					return;
				
				var sourceElement=clickedElement.parent().children(".autoListSource");
				var addElement=$(sourceElement).clone(true);
				addElement.removeClass("autoListSource");
				if (clickedElement.hasClass("autoListSource"))
					addElement.insertBefore(clickedElement);
				else
					addElement.insertAfter(clickedElement);
			});
			
			//create an auto-add handler if the source-element is changed
			$(".autoFocusAdd :input", params.element).focus(function(){
				var changedElement=$(this, params.element).closest(".autoListItem");
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
			$(".autoClickDel", params.element).click(function()
			{		
				var clickedElement=$(this, params.element).closest(".autoListItem");
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
			$(".autoSort", params.element).sortable({
				placeholder: "autoSortPlaceholder",
				handle: ".autoClickSort",
				cancel: ".autoListSource",
				items:".autoGet",
				forceHelperSize: true,
				forcePlaceholderSize: true
			});
			
			//focus the correct input field
//			console.log($(".autoGet", params.element).autoFindField(params.viewParams.focus));
//			console.log($(viewFieldsToSelector(params.viewParams.focus), params.element));
	//		if (params.viewParams && params.viewParams.focus)
		//		$(viewFieldsToSelector(params.viewParams.focus), params.element).focus();
			//else
				//$(viewFieldsToSelector(params.defaultFocus), params.element).focus();

			if (params['getData'])
			{
				//get data
				rpc(
					params.getData, 
					params.viewParams,
					function(result)
					{
						$(".autoClickSave", params.element).prop("disabled", false);

						if (result.data)
						{
							$(".autoPut", params.element).autoPut(meta, result.data, {
								element: params.element
							});
						}
						

						if (viewShowError(meta, result, params.element))
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
				$(".autoClickSave", params.element).prop("disabled", false);

				if (params['loadCallback'])
					params['loadCallback'](result);
			}
		}
	);
	
	//save 
	var save=function()
	{
		$(".autoClickSave", params.element).prop("disabled", true);

		//are there putParams that we should COPY to putData
		var putParams={};
		if (params['putParams'])
			putParams=jQuery.extend(true, {}, params['putParams']); //COPY, and not by reference!

		//get the data
		$(".autoGet", params.element).autoGet(meta, putParams, { 
			element: params.element 
		});

		//put data
		rpc(
			params['putData'],
			putParams,
			function(result)
			{
				$(".autoClickSave", params.element).prop("disabled", false);
				
				viewShowError(meta, result, params.element);

				if (result)
				{
					if ('error' in result)
					{
						if (params['errorCallback']!=null)
							params['errorCallback'](result);
						
						return;
					}
				}

				//all ok, call save callback?
				if (params['saveCallback']!=null)
					params['saveCallback'](result);

				viewRefresh();
				
				//all ok, close window
				viewClose(params.element);
			}
		);
	};

	
	$(".autoClickSave", params.element).click(save);
	$(params.element).bind('keypress', function(e) {
		
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
		
		var popupParams={
			"focus": fields
		};
		popupParams[params.id]=id;
		
		viewPopup(
			event,
			params.editView, 
			popupParams,
			//closed
			function(){
				element.removeClass("ui-state-highlight");
			}
		);
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
						if (!viewShowError(meta, result, rowElement))
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
			params.viewParams,						
			function(result)
			{
				viewShowError(meta, result, params.element);

				if (update)
				{
					//since its an update, dont get confused with the other autoput-list items
					$(".autoListSource:first", params.element).autoList(meta, result['data'], {
						updateOn:params.id,
						element: params.element
					});
				}
				else
				{
					$(".autoListSource:first", params.element).autoList(meta, result['data'], {
						element: params.element
					});
				}
					
				$(".autoClickDel", params.element).unbind('click');
				$(".autoClickDel", params.element).click( del);
				$(".autoClickEdit", params.element).unbind( 'click');
				$(".autoClickEdit", params.element).click( edit);

				if (!update)
				{
					params.loadCallback(result);
				}
			}
		);
	}

	$(params.element).bind('refresh',function()
	{
		//console.log("reresh!!");
		getData(true);
	});

	//get meta
	rpc(
		params.getMeta,
		params.viewParams,
		function(result)
		{
			meta=result['data'];
			//add real input to autoMeta divs. 
			$(".autoMeta", params.element).autoMeta(meta);
			
			//make sure autoListItems are recognised (normally autoMeta does this when it encounters and array or hash type)
			$(".autoListSource:first", params.element).addClass("autoListItem");
			
			getData(false);
		}
	)
}

