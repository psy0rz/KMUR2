<script>

  
$(document).ready(function()
{


	//get meta
	rpc(
		"users.getMeta",
		{
		},						
		function(result)
		{
			//add real input to autoCreate divs. 
			$(".autoCreate").autoCreate(result['data']);
			
			//get data
			rpc(
				"users.getAll",
				{
				},						
				function(result)
				{
					viewShowError(result);


					$(".autoList").autoList(result['data']);

					var edit=function(event)
					{
						var id=$(this).parent(".autoList").attr("_value");
						viewPopup(
							event,
							"users.edit", 
							{
								"_id":id,
								"highlight":$(this).attr("_key")
							},
							function(){
								//refresh this row on close
								rpc(
									"users.get",
									{ 
										"_id":id 
									},
									function(result)
									{
										viewShowError(result);
										var changed=$(".autoList[_value="+id+"]");
										changed.find(".autoFill").autoFill(result['data']);
										changed.effect('highlight',3000);
									}
								);
							}
						);
					};
					$(".clickPopup").click(edit);
					var del=function(event)
					{
						var id=$(this).parent(".autoList").attr("_value");
						var oldValue=$(this).html();
						var yes=$("<input>");
						yes.val("Ja").click(function()
						{
							console.log("WIE");
						});
						var no=$("<input>");
						no.val("Nee").click(function()
						{
							console.log("WIE");
							
						};
						
						$(this).replaceWith(
							$("<div>").text("Verwijderen?")
						);
						$(this).append(yes);
						$(this).append(no);
						$(this).effect('highlight',3000);
					};
					$(".clickDelete").click(del);
					
					
					


					viewReady({
						'title':"Gebruikers overzicht"
					});

				}
			);

		}
	)
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
	<td class='autoFill clickPopup' _key='active' >
	<td class='autoFill clickEdit' _key='username' >
	<td class='autoFill clickPopup' _key='name'>
	<td class='autoFill clickPopup' _key='rights'>
	<td class='autoFill clickDelete'>DEL
</tr>
</table>

<span style='color:#ff0000;' id='error'></span>

