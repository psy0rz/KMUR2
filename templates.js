
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
			$(".autoCreate", params['parent']).autoCreate(result['data']);

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
							$(".autoFill", params['parent']).autoFill(result['data']);
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
	$("#submit", params['parent']).click(function()
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

				//all ok, close window
				viewClose();
			}
		);
	});
}