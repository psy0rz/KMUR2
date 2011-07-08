<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
 
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<script type="text/javascript" src="includes.js"></script>

	<script>

	function showError(result)
	{
		$("#error").text("");
		$(".errorHighlight").removeClass("errorHighlight");
	
		if (result!=null)
		{
			if (result["error"]!=null)
			{
				$("#error").text(result["error"]["message"]);
				if (result["error"]["field"]!=null)
				{
					$(':input[_key|="'+result["error"]["field"]+'"]').addClass("errorHighlight");
				}
			}
		}
	}

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

				//transform autoCreate divs to real inputs
				if (result['meta']!=null)
				{
					$(".autoCreate").autoCreate(result['meta']);
				}

				if (result['data']!=null)
				{
					//fill it in
					$(".autoInput").each(function () {
						$(this).val(result['data'][$(this).attr("_key")]);
					});

					$(".autoText").each(function () {
						$(this).text(result['data'][$(this).attr("_key")]);
					});
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

			$(".autoInput").each(function () {
				params[$(this).attr("_key")]=$(this).val();
			});


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
		border-width: 1px;
		border-color: red;
		background: yellow;
	}
	
	</style> 
 
</head> 
 
 
<body style=' 
	'> 

<div style='color:#ff0000;' id='error'></div>

Naam: <span class='autoText' _key='name'></span> dus.

<div id='groepje'>
	<div class='autoCreate' _key='gender'></div>
	<div class='autoCreate' _key='name'></div>
</div>

<div class='autoCreate' _key='password'></div>

<div class='autoCreate' _key='active'></div>


<button id='save'>Opslaan</button>

</body> 
</html> 
