<script>

$(document).ready(function()
{
	//rpc("users.getAll",{"sadf":"df"},function(){});
	
	//get data
	rpc(
		"users.getAll",
		{
		},
		function(result)
		{
			showError(result);

			//add real input to autoCreate divs. 
			if (result['meta']!=null)
			{
				$(".autoCreate").autoCreate(result['meta']);
			}

			if (result['data']!=null)
			{
				$(".autoList").autoList(result['data']);
			}
			
			$(".autoFill").click(function()
			{
				$(this).autoCreate(result["meta"]);
				$(this).focus();
			});
		}
	);
	
	//save 
	$("#save").click(function()
	{
		$("#save").prop("disabled", true);

		//collect all the autoInput data
		var params={};
		params["_id"]=$.url().param("_id");

		$(".autoFill").autoGet(params);

		//put data
		rpc(
			"users.put",
			params,
			function(result)
			{
				$("#save").prop("disabled", false);
				showError(result);
				
			}
		);
	});

});

</script>


<h1>Gebruikers</h1>


<table>
<tr>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
</tr>

<tr class='autoList'>
	<td class='autoFill' _key='active' >
	<td class='autoFill' _key='username' >
	<td class='autoFill' _key='name'>
</tr>
</table>


<span style='color:#ff0000;' id='error'></span>

