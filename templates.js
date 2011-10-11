//////////////////////////////////////////////////////////////////////////////////////////
function templateForm(params)
{
	var meta;
	
	//disable submit button while loading
	$(".autoClickSave", params.element).prop("disabled", true);
	
	//get meta data
	rpc(
		params['getMeta'], 
		params['viewParams'],
		function(result)
		{
			meta=result['data'];
			$(".autoCreate", params.element).autoCreate(meta);
			
			//add delete handlers for lists
			$(".autoClickDel", params.element).click(function()
			{		
				$(this).confirm(function()
				{
					console.log(this);
					var listItem=$(this, params.element).closest(".autoListItem");
					listItem.hide('fast',function()
					{
						listItem.remove();
					});
					
				});
			});
			
			//make stuff sortable
			$(".autoSort", params.element).sortable({
				placeholder: "autoSortPlaceholder",
				handle: ".autoClickSort"
			});
			
			//focus the correct input field
			if (params['viewParams'] && params['viewParams']['highlight'])
				$('[_key="'+params['viewParams']['highlight']+'"]', params.element).focus();
			else
				$('[_key='+params['defaultFocus']+']', params.element).focus();

			if (params['getData'])
			{
				//get data
				rpc(
					params['getData'], 
					params['viewParams'],
					function(result)
					{
						$(".autoClickSave", params.element).prop("disabled", false);

						if (result.data)
						{
							$(".autoFill", params.element).autoFill(meta, result.data);
						}
						

						if (viewShowError(result, params.element))
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
				
				viewShowError(result, params.element);

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
		var listParent=$(this).parent(".autoListItem");
		var element=$(this);
		var id=listParent.attr("_value");
		element.addClass("ui-state-highlight");
		
		var popupParams={
			"highlight":$(this).attr("_key")
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
		$(this).confirm(function()
		{
			var rpcParams={};
			rpcParams[params.id]=id;
			rpc(
				params.delData,
				rpcParams,
				function(result)
				{
					if (!viewShowError(result, rowElement))
					{
						viewRefresh();
					}
				}
			);
		});
	};

	function getData(update)
	{

		//get data
		rpc(
			params.getData,
			{
			},						
			function(result)
			{
				viewShowError(result, params.element);

				if (update)
				{
					$(".autoFill:first", params.element).autoList(meta, result['data'], {
						updateOn:params.id,
						keepSource: true
					});
				}
				else
				{
					$(".autoFill:first", params.element).autoList(meta, result['data'], {
						keepSource: true
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
		{
		},						
		function(result)
		{
			meta=result['data'];
			//add real input to autoCreate divs. 
			$(".autoCreate", params.element).autoCreate(meta);
			getData(false);
		}
	)
}

