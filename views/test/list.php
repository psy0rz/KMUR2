<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	templateList({
		view		: view,
		id		: '_id',
		getMeta		: 'test.getMeta',
		getMetaParams	: view.params,
		getData		: 'test.getAll',
		getDataParams	: view.params,
		delData		: 'test.del',
		editView		: {
			name: 'test.edit',
			mode: 'main',
			params: view.params
		},
		loadCallback	: function(result) {
			viewReady({
				view: view,
				title: "test overzicht"
			});
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});


});

</script>

<table >
<tr class='ui-widget-header'>
	<th class='autoMeta autoOrder' _key='active' _meta='desc'>
	<th class='autoMeta autoOrder autoOrderAsc' _key='username' _meta='desc'>
	<th class='autoMeta autoOrder' _key='hash.username' _meta='desc'>
	<th class='autoMeta autoOrder' _key='hash.bla' _meta='desc'>
	<th class='autoMeta autoOrder' _key='rights' _meta='desc'>
	<th class='autoMeta autoOrder' _key='array' _meta='desc'>
	<th>
</tr>

<tr>
	<td>
	<td><input type='text' class='autoFilter autoFilterFocus' _key='username'>
	<td><input type='text' class='autoFilter' _key='hash.username'>
	<td><input type='text' class='autoFilter' _key='hash.bla'>
	<td>
</tr>

<tr class='colorRows autoPut autoListSource ui-widget-content' _key='_id' _value>
	<td class='autoPut autoClickEdit' _key='active'>
	<td class='autoPut autoClickEdit' _key='username'>
	<td class='autoPut autoClickEdit' _key='hash.username'>
	<td class='autoPut autoClickEdit' _key='hash.bla'>
	<td class='autoPut autoClickEdit' _key='rights'>
	<td class='autoMeta autoOrder' _key='array'>
		<table >
			<tr class='autoPut' _key='array'>
				<td class='autoPut' _key='array.username'>			
				<td class='autoPut' _key='array.foo'>
			</tr>			
		</table>
	<td class='autoClickDel ui-icon ui-icon-trash'>
</tr>
</table>

