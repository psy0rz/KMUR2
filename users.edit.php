<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
 
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<script type="text/javascript" src="includes.js"></script>

	<script>


	$(document).ready(function()
	{
		//rpc("users.getAll",{"sadf":"df"},function(){});
		
		//get data
		rpc(
			"users.get",
			{
				"_id":$.url().param("_id"),
			},
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


	<style> 
	
	.errorHighlight
	{
		border-style: solid;
		border-width: 2px;
		border-color: red;
		background: yellow;
		color: red;
	}
	
	</style> 
 
</head> 
 
 
<body style=' 
	'> 

<h1>Wijzigen gebruiker <span class='autoFill' _key='username'></span></h1>


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
	<td><span class='autoCreate' _key='address' _meta='desc'></span>
	<td><span class='autoCreate' _key='address'></span>
</tr>
</table>






<button id='save'>Opslaan</button>
<span style='color:#ff0000;' id='error'></span>

</body> 
</html> 
