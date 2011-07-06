<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
 
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<script type="text/javascript" src="form.js"></script>

	<script>
	$(document).ready(function()
	{
		//get data
		rpc(
			"users.get",
			{
				"_id":$.url().param("_id"),
			},
			function(result)
			{
				//fill it in
				$("[_key]").filter(":input").each(function () {
					$(this).val(result['data'][$(this).attr("_key")]);
				});

				$("[_key]").not(":input").each(function () {
					$(this).text(result['data'][$(this).attr("_key")]);
				});

			}
		);
		
		//save 
		$("#save").click(function()
		{
			$("#save").prop("disabled", true);

			//collect all the data
			var params=new Array();
			params["_id"]=$.url().param("_id");
			
			$("[_key]").filter(":input").each(function () {
				params[$(this).attr("_key")]=$(this).val();
			});

			$("[_key]").not(":input").each(function () {
				params[$(this).attr("_key")]=$(this).text();
			});
			
			//put data
			rpc(
				"users.put",
				params,
				function(result)
				{
					$("#save").prop("disabled", false);
					//show errors
					$("#error").text(result["error"]);
					
				}
			);
		});

	});
	
	</script>


	<style> 
	</style> 
 
</head> 
 
 
<body style=' 
	'> 

<div style='color:#ff0000;' id='error'></div>

<div _key='title'></div>
<input type='text' _key='author'></input>

<select _key='gender'>
	<option value="M">Man</option>
	<option value="F">Vrouw</option>
	<option value="A">Alien</option>
</select>

<button id='save'>Opslaan</button>

</body> 
</html> 
