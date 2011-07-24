<script>

  
$(document).ready(function()
{
	var meta={};

	var edit=function(event)
	{
		var listParent=$(this).parent(".autoListClone");
		var element=$(this);
		var id=listParent.attr("_value");
		element.addClass("highlight");
		viewPopup(
			event,
			"users.edit", 
			{
				"_id":id,
				"highlight":$(this).attr("_key")
			},
			//closed
			function(){
				element.removeClass("highlight");
				//refresh this row on close
//				$("body").trigger("refresh");
	//			rpc(
//					"users.get",
				//	{ 
			//			"_id":id 
		//			},
	//				function(result)
//					{
					//	viewShowError(result);
				//		var changed=$(".autoList[_value="+id+"]");
			//			changed.find(".autoFill").autoFill(result['data']);
		//				changed.effect('highlight',3000);
	//				}
//				);
			}
		);
	};

	var del=function(event)
	{
		var id=$(this).parent(".autoListClone").attr("_value");
		$(this).confirm(function()
		{
			rpc(
				"users.del",
				{ 
					"_id":id 
				},
				function(result)
				{
					if (!viewShowError(result))
					{
						var deleted=$(".autoList[_value="+id+"]");
						deleted.hide(1000, function()
						{
							deleted.remove();
						});
					}
				}
			);
		});
	};

	function getData(update)
	{

		//get data
			rpc(
			"users.getAll",
			{
			},						
			function(result)
			{
				viewShowError(result);

				if (update)
				{
					$(".autoList").autoList(meta, result['data'], {
						'updateOn':'_id'
					});
				}
				else
				{
					$(".autoList").autoList(meta, result['data']);
				}
					
				$(".clickDelete").unbind('click');
				$(".clickDelete").click( del);
				$(".clickPopup").unbind( 'click');
				$(".clickPopup").click( edit);

				viewReady({
					'title':"Gebruikers overzicht"
				});

			}
		);
	}



	$("body").bind('refresh',function()
	{
		//console.log("reresh!!");
		getData(true);
	});

	//get meta
	rpc(
		"users.getMeta",
		{
		},						
		function(result)
		{
			meta=result['data'];
			//add real input to autoCreate divs. 
			$(".autoCreate").autoCreate(meta);

			getData(false);
		}
	)
});

</script>


<table >
<tr class='ui-widget-header'>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
	<th><span class='autoCreate' _key='gender' _meta='desc'></span>
	<th><span class='autoCreate' _key='rights' _meta='desc'></span>
	<th>
</tr>

<tr class='autoList autoFill ui-widget-content' _key='_id' _value>
	<td class='autoFill clickPopup' _key='active' >
	<td class='autoFill clickEdit' _key='username' >
	<td class='autoFill clickPopup' _key='name'>
	<td class='autoFill clickPopup' _key='gender'>
	<td class='autoFill clickPopup' _key='rights'>
	<td class='clickDelete'>DEL
</tr>
</table>

<span style='color:#ff0000;' id='error'></span>

