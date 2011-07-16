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
			
			var click=function(event)
			{
				viewPopup(
					event,
					"users.edit", 
					{
						"_id":$(this).parent().attr("_value"),
						"highlight":$(this).attr("_key")
					}
				);
			};
			$(".buttonEdit").click(click);
			
			viewReady({
				'title':"Gebruikers overzicht"
			});

		}
	);
	

});

</script>



<table class='ui-widget ui-widget-content'>
<tr>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
	<th>
</tr>

<tr class='autoList autoFill ui-widget-header' _key='_id' _value>
	<td class='autoFill buttonEdit' _key='active' >
	<td class='autoFill buttonEdit' _key='username' >
	<td class='autoFill buttonEdit' _key='name'>
	<td class='autoFill buttonDel'>
	<td class='autoFill buttonEdit'>EDIT
</tr>
</table>


<span style='color:#ff0000;' id='error'></span>

</div>