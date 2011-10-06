<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	
//	console.log($(".autoCreate").not(".autoCreate .autoCreate"));
//	console.log($(".autoCreate","#list").not(".autoCreate .autoCreate","#list"));
//	console.log($(".autoCreate:not(.autoCreate .autoCreate)"));
//	console.log($(".autoCreate:not(.autoCreate .autoCreate)","#list"));
	

	var title="";
	var viewParams=<?=viewGetParams()?>;
	templateForm({
		'element'		: viewParams.element,
		'getMeta'		: 'invoices.getMeta',
		'getData'		: 'invoices.get',
		'viewParams' 	: viewParams,
		'putData'		: 'invoices.put',
		'putParams'		: { "_id": viewParams._id },
		'defaultFocus'	: '',
		'loadCallback'	: function(result) {
			if (viewParams._id)
			{
				title="Wijzigen factuur "+result.data.number;
				menuAddFavorite({
					'menu':		"invoices",
					'desc':		"Wijzig factuur "+result.data.number,
					'view':		"invoices.edit",
					'params':	viewParams,
					'mode':		"normal"
				});
			}
			else
				title="Nieuwe factuur";
				
			viewReady({
				'element':viewParams.element,
				'title':title
			});
			
		},
		'errorCallback'	: function(result) { },
		'saveCallback'	: function(result) { }
	});

});

</script>



<table>
<tr>
	<td class='autoCreate' _key='userId' _meta='desc'>
	<td class='autoCreate' _key='userId'>
</tr>
<tr>
	<td class='autoCreate' _key='status' _meta='desc'>
	<td class='autoCreate' _key='status'>
</tr>
<tr>
	<td class='autoCreate' _key='desc' _meta='desc'>
	<td class='autoCreate' _key='desc'>
</tr>
<tr>
	<td class='autoCreate' _key='items' _meta='desc'>
	<td >
	
		<table class='autoCreate autoFill' _key='items'>
			<tr class='ui-widget-header'>
				<th class='autoCreate' _key='amount' _meta='desc'>
				<th class='autoCreate' _key='desc' _meta='desc'>
				<th class='autoCreate' _key='price' _meta='desc'>
			</tr>

			<tr class='colorRows autoFill autoGet ui-widget-content' _key='index' _value>
				<td class='autoCreate' _key='amount' >
				<td class='autoCreate' _key='desc' >
				<td class='autoCreate' _key='price' >
			</tr>
		</table>
</tr>
</table>


<button class='autoClickSave'>Opslaan</button>
<span class='autoError'></span>

