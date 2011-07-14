<div id='houder'>
<script>

  
$(document).ready(function()
{
//	console.log("WOEI",$(this));
	//rpc("users.getAll",{"sadf":"df"},function(){});
	$("#edit").dialog({ autoOpen: false });
	//$("#edit").attr("src","viewPopup.php");

	//console.debug(this);

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
			
			$(".buttonEdit").click(function()
			{
				$("#edit").dialog('open');
				var $f = $("#edit");
				$f[0].contentWindow.viewLoad(
					"#viewMain",
					"users.edit", 
					{
						"_id":$(this).attr("_value")
					}
				);


			});
		}
	);
	

});

</script>


<h1>Gebruikers</h1>


<table class='ui-widget ui-widget-content'>
<tr>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
	<th>
</tr>

<tr class='autoList ui-widget-header'>
	<td class='autoFill' _key='active' >
	<td class='autoFill' _key='username' >
	<td class='autoFill' _key='name'>
	<td class='autoFill buttonDel' _key='_id' _value>
	<td class='autoFill buttonEdit' _key='_id' _value>EDIT
</tr>
</table>

<iframe id='edit' src='viewPopup.php'>
</iframe>

<span style='color:#ff0000;' id='error'></span>

</div>