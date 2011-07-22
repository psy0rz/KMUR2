<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var viewParams=<?=viewGetParams()?>;

	rpc(
		"users.getMeta", 
		viewParams,
		function(result)
		{
			$(".autoCreate").autoCreate(result['data']);
			$('[_key|=username]').focus();
		}
	);
	
	$("#save").click(function()
	{
		$("#save").prop("disabled", true);

		var params={
		};
		$(".autoFill").autoGet(params);
		
		//put data
		rpc(
			"users.authenticate",
			params,
			function(result)
			{
				$("#save").prop("disabled", false);
				if (result)
				{
					if ('error' in result)
					{
						showError(result);
						return;
					}
				}
				
				//all ok, close window
				viewClose();
			}
		);
	});

});

</script>



<table>
<tr>
	<td><span class='autoCreate' _key='username' _meta='desc'></span>
	<td><span class='autoCreate' _key='username'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='password' _meta='desc'></span>
	<td><span class='autoCreate' _key='password'></span>
</tr>
</table>



<button id='save'>Login</button>
<span style='color:#ff0000;' id='error'></span>

