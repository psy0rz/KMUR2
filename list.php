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

				//transform autoCreate divs to real inputs
				if (result['meta']!=null)
				{
					$(".autoCreate").each(function () 
					{
						var key=$(this).attr("_key");
						var meta=result['meta'][key];
						
						if (meta!=null)
						{
							if (meta['type']=='string')
							{
								if (meta['max']==null || meta['max']>100)
								{
									$(this).append(
										$("<textarea>")
											.addClass("autoInput")
											.attr("_key",key)
									);
								}
								else
								{
									$(this).append(
										$("<input>")
											.addClass("autoInput")
											.attr("_key",key)
											.attr("type","text")
									);
								}
							}
							else if (meta['type']=='password')
							{
								$(this).append(
									$("<input>")
										.addClass("autoInput")
										.attr("_key",key)
										.attr("type","password")
								);
							}
							else if (meta['type']=='float' || meta['type']=='integer')
							{
								$(this).append(
									$("<input>")
										.addClass("autoInput")
										.attr("_key",key)
										.attr("type","text")
								);
							}
							else if (meta['type']=='select')
							{
								//create select element
								var s=$("<select>")
									.addClass("autoInput")
									.attr("_key",key)
									.attr("type","text");

								//add choices
								$.each(meta['choices'], function(choice, desc){
									s.append(
										$("<option>")
											.attr("value",choice)
											.text(desc)
									);
								});

								//add results to div
								$(this).append(s);
							}

						}
					});
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

<div class='autoCreate' _key='name'></div>
<div class='autoCreate' _key='gender'></div>
<div class='autoCreate' _key='password'></div>


<button id='save'>Opslaan</button>

</body> 
</html> 
