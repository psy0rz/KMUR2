//////////////////////////////////////////////////////////////////////////////////////////
function templateForm(params)
{

	//disable submit button while loading
	$("#submit", params['parent']).prop("disabled", true);
	
	//get meta data
	rpc(
		params['getMeta'], 
		params['viewParams'],
		function(result)
		{
			var meta=result['data'];
			$(".autoCreate", params['parent']).autoCreate(meta);

			//focus the correct input field
			if (params['viewParams'] && params['viewParams']['highlight'])
				$('[_key|="'+params['viewParams']['highlight']+'"]', params['parent']).focus();
			else
				$('[_key|='+params['defaultFocus']+']', params['parent']).focus();

			if (params['getData'])
			{
				//get data
				rpc(
					params['getData'], 
					params['viewParams'],
					function(result)
					{
						$("#submit", params['parent']).prop("disabled", false);

						viewShowError(result, params['parent']);

						if (result['data']!=null)
						{
							$(".autoFill", params['parent']).autoFill(meta, result['data']);
						}

						if (params['loadCallback'])
							params['loadCallback'](result);

					}
				);
			}
			//when not loading data, dont forget to call the loadCallback:
			else
			{
				$("#submit", params['parent']).prop("disabled", false);

				if (params['loadCallback'])
					params['loadCallback'](result);
			}
		}
	);
	
	//save 
	var save=function()
	{
		$("#submit", params['parent']).prop("disabled", true);

		//determine parameters to pass to putData
		var putParams={};
		if (params['putParams'])
			putParams=params['putParams'];
		$(".autoFill", params['parent']).autoGet(putParams);
		
		//put data
		rpc(
			params['putData'],
			putParams,
			function(result)
			{
				$("#submit", params['parent']).prop("disabled", false);
				
				viewShowError(result, params['parent']);

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

				viewTriggerRefresh(params['parent']);
				
				//all ok, close window
				viewClose(params['parent']);
			}
		);
	};

	
	$("#submit", params['parent']).click(save);
	$(params['parent']).bind('keypress', function(e) {
		
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
		var listParent=$(this).parent(".autoListClone");
		var element=$(this);
		var id=listParent.attr("_value");
		element.addClass("highlight");
		
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
				element.removeClass("highlight");
			}
		);
	};

	var del=function(event)
	{
		var id=$(this).parent(".autoListClone").attr("_value");
		$(this).confirm(function()
		{
			var rpcParams={};
			rpcParams[params.id]=id;
			rpc(
				params.delData,
				rpcParams,
				function(result)
				{
					if (!viewShowError(result, params.parent))
					{
						viewTriggerRefresh(params.parent);
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
				viewShowError(result, params.parent);

				if (update)
				{
					$(".autoList", params.parent).autoList(meta, result['data'], {
						'updateOn':params.id
					});
				}
				else
				{
					$(".autoList", params.parent).autoList(meta, result['data']);
				}
					
				$(".clickDelete", params.parent).unbind('click');
				$(".clickDelete", params.parent).click( del);
				$(".clickPopup", params.parent).unbind( 'click');
				$(".clickPopup", params.parent).click( edit);

				if (!update)
				{
					params.loadCallback(result);
				}
			}
		);
	}

	$(params.parent).bind('refresh',function()
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
			$(".autoCreate", params.parent).autoCreate(meta);
			getData(false);
		}
	)
}

