<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var viewParams=<?=viewGetParams()?>;

	//get data
	rpc(
		"users.get", 
		viewParams,
		function(result)
		{
			showError(result);

			if (result['meta']!=null)
			{
				$(".autoCreate").autoCreate(result['meta']);
			}

			if (result['data']!=null)
			{
				$(".autoFill").autoFill(result['data']);
			}

			viewReady({
				'title':"Wijzigen gebruiker "+result['data']['username']
			});
			
			$('[_key|="'+viewParams["highlight"]+'"]').focus();
		}
	);
	
	//save 
	$("#save").click(function()
	{
		$("#save").prop("disabled", true);

		var params={
			"_id":viewParams["_id"]
		};
		$(".autoFill").autoGet(params);
		
		//put data
		rpc(
			"users.put",
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
	<td><span class='autoCreate' _key='active' _meta='desc'></span>
	<td><span class='autoCreate' _key='active'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='username' _meta='desc'></span>
	<td><span class='autoCreate' _key='username'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='password' _meta='desc'></span>
	<td><span class='autoCreate' _key='password'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='keutel' _meta='desc'></span>
	<td><span class='autoCreate' _key='keutel'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='rights' _meta='desc'></span>
	<td><span class='autoCreate' _key='rights'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='name' _meta='desc'></span>
	<td><span class='autoCreate' _key='name'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='gender' _meta='desc'></span>
	<td><span class='autoCreate' _key='gender'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='country' _meta='desc'></span>
	<td><span class='autoCreate' _key='country'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='address' _meta='desc'></span>
	<td><span class='autoCreate' _key='address'></span>
</tr>
</table>



<button id='save'>Opslaan</button>
<span style='color:#ff0000;' id='error'></span>

