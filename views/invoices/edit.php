<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	
//	console.log($(".autoMeta").not(".autoMeta .autoMeta"));
//	console.log($(".autoMeta","#list").not(".autoMeta .autoMeta","#list"));
//	console.log($(".autoMeta:not(.autoMeta .autoMeta)"));
//	console.log($(".autoMeta:not(.autoMeta .autoMeta)","#list"));
	

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
	<td class='autoMeta' _key='userId' _meta='desc'>
	<td class='autoMeta' _key='userId'>
</tr>
<tr>
	<td class='autoMeta' _key='status' _meta='desc'>
	<td class='autoMeta' _key='status'>
</tr>
<tr>
	<td class='autoMeta' _key='desc' _meta='desc'>
	<td class='autoMeta' _key='desc'>
</tr>
<tr>
	<td class='autoMeta' _key='statusDate' _meta='desc'>
	<td class='autoMeta' _key='statusDate'>
</tr>
<tr>
	<td class='autoMeta' _key='items' _meta='desc'>
	<td >
	
		<table class='autoMeta' _key='items'>
			<thead>
				<tr class='ui-widget-header'>
					<th>
					<th class='autoMeta' _key='amount' _meta='desc'>
					<th class='autoMeta' _key='desc' _meta='desc'>
					<th class='autoMeta' _key='price' _meta='desc'>
					<th>
					<th>
				</tr>
			</thead>
			<tbody class='autoSort'>
				<tr class='colorRows autoListSource autoFocusAdd ui-widget-content'>
					<td class='autoClickSort ui-icon ui-icon-arrowthick-2-n-s'> 
					<td class='autoMeta' _key='amount' >
					<td class='autoMeta' _key='desc' >
					<td class='autoMeta' _key='price' >
					<td class='autoClickDel ui-icon ui-icon-trash'>
					<td class='autoClickAdd ui-icon ui-icon-plus'>
				</tr>
			</tbody>
		</table>
</tr>
</table>


<button class='autoClickSave'>Opslaan</button>
<span class='autoError'></span>

