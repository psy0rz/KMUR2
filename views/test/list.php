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
	<th class='autoMeta templateOnClickOrder' _key='active' _meta='desc'>
	<th class='autoMeta templateOnClickOrder templateOrderAsc' _key='username' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='hash.username' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='hash.bla' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='rights' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='array' _meta='desc'>
	<th>
</tr>

<tr>
	<td>
	<td><input type='text' class='templateOnChangeFilter templateSetFocus' _key='username'>
	<td><input type='text' class='templateOnChangeFilter' _key='hash.username'>
	<td><input type='text' class='templateOnChangeFilter' _key='hash.bla'>
	<td>
</tr>

<tr class='colorRows autoListSource ui-widget-content' _index='_id' >
	<td class='autoPut templateOnClickEdit' _key='active' _html>
	<td class='autoPut templateOnClickEdit' _key='username' _html>
	<td class='autoPut templateOnClickEdit' _key='hash.username' _html>
	<td class='autoPut templateOnClickEdit' _key='hash.bla' _html>
	<td class='autoPut templateOnClickEdit' _key='rights' _html>
	<td>
		<table >
			<tr class='autoMeta autoListSource' _key='array'>
				<td class='autoPut templateOnClickEdit' _key='array.username' _html>			
				<td class='autoPut templateOnClickEdit' _key='array.foo' _html>
			</tr>			
		</table>
	<td class='templateOnClickDel ui-icon ui-icon-trash'>
</tr>
</table>

