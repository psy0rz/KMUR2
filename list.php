<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
 
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<script type="text/javascript" src="form.js"></script>

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

				//transform input divs to real inputs
				if (result['meta']!=null)
				{
					$(".input[_key]").each(function () 
					{
						var key=$(this).attr("_key");
						if (result['meta'][key]!=null)
						{
							if (result['meta'][key]['type']=='string')
							{
								$(this).removeAttr('_key');
								$(this).html("<input type='text' _key='"+key+"'></input>");
							}
						}
					});
				}

				if (result['data']!=null)
				{
					//fill it in
					$("[_key]").filter(":input").each(function () {
						$(this).val(result['data'][$(this).attr("_key")]);
					});

					$("[_key]").not(":input").each(function () {
						$(this).text(result['data'][$(this).attr("_key")]);
					});
				}
			}
		);
		
		//save 
		$("#save").click(function()
		{
			$("#save").prop("disabled", true);

			//collect all the data
			var params={};
			params["_id"]=$.url().param("_id");

			$("[_key]").filter(":input").each(function () {
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


<div class='input' _key='name'></div>

<input type='text' _key='username'></input>

<input  type='text' _key='name'></input>

<select _key='gender'>
	<option value="M">Man</option>
	<option value="F">Vrouw</option>
	<option value="A">Alien</option>
</select>

<button id='save'>Opslaan</button>

</body> 
</html> 
