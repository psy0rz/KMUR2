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

			$("td").hover(
				function(){ 
					$(this).addClass("ui-state-hover"); 
				},
				function(){ 
					$(this).removeClass("ui-state-hover"); 
				}
			);


			var edit=function(event)
			{
				viewPopup(
					event,
					"users.edit", 
					{
						"_id":$(this).parent().attr("_value"),
						"highlight":$(this).attr("_key")
					},
					function(){  }
				);
			};
			$(".buttonEdit").click(edit);

			$("#add").click(function()
			{
				viewPopup(
					event,
					"users.edit", 
					{
						'_id':""
					},
					function(){}
				);
			});


			viewReady({
				'title':"Gebruikers overzicht"
			});

		}
	);
	

});

</script>


<table >
<tr class='ui-widget-header'>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
	<th><span class='autoCreate' _key='rights' _meta='desc'></span>
	<th>
</tr>

<tr class='autoList autoFill ui-widget-content' _key='_id' _value>
	<td class='autoFill buttonEdit' _key='active' >
	<td class='autoFill buttonEdit' _key='username' >
	<td class='autoFill buttonEdit' _key='name'>
	<td class='autoFill buttonEdit' _key='rights'>
	<td class='autoFill buttonDel'>
</tr>
</table>

<input type='submit' id='add' value='add'/>

<span style='color:#ff0000;' id='error'></span>

