<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	
//	console.log($(".autoMeta").not(".autoMeta .autoMeta"));
//	console.log($(".autoMeta","#list").not(".autoMeta .autoMeta","#list"));
//	console.log($(".autoMeta:not(.autoMeta .autoMeta)"));
//	console.log($(".autoMeta:not(.autoMeta .autoMeta)","#list"));
	

	var title="";
	var view=<?=viewGet()?>;
	templateForm({
		view			: view,
		getMeta			: 'invoices.getMeta',
		getMetaParams		: view.params,
		getData			: 'invoices.get',
		getDataParams		: view.params,
		putData			: 'invoices.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: '',
		loadCallback	: function(result) {
			if (view.params._id)
			{
				title="Wijzigen factuur "+result.data.number;
				menuAddFavorite({
					menu:	"invoices",
					desc:	"Wijzig factuur "+result.data.number,
					view:	view
				});
			}
			else
				title="Nieuwe factuur";
				
			viewReady({
				view	:view,
				title	:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});

});

</script>



<table>
<tr>
	<td class='autoMeta' _key='number' _meta='desc'>
	<td class='autoFill' _key='number'>
</tr>
<tr>
	<td class='autoMeta' _key='userId' _meta='desc'>
	<td class='autoMeta' _key='userId'>
</tr>
<tr>
	<td class='autoMeta' _key='user' _meta='desc'>
	<td class='autoMeta' _key='user'>
		<table >
			<tr>
				<td class='autoMeta' _key='username' _meta='desc'>
				<td class='autoMeta' _key='username'>
			</tr>
		</table>
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

