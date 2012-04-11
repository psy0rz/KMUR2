<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	templateList({
		view		: view,
		id		: '_id',
		getMeta		: 'users.getMeta',
		getMetaParams	: view.params,
		getData		: 'users.getAll',
		getDataParams	: view.params,
		delData		: 'users.del',
		editView		: {
			name: 'users.edit',
			mode: 'main',
			params: view.params
		},
		loadCallback	: function(result) {
			viewReady({
				view: view,
				title: "Gebruikers overzicht"
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
	<th class='autoMeta templateOnClickOrder' _key='name' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='company' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='rights' _meta='desc'>
	<th>
</tr>

<tr>
	<td>
	<td><input type='text' class='templateOnChangeFilter templateSetFocus' _key='username'>
	<td><input type='text' class='templateOnChangeFilter' _key='name'>
	<td><input type='text' class='templateOnChangeFilter' _key='company'>
	<td>
</tr>

<tr class='colorRows autoListSource ui-widget-content' _index='_id'>
	<td class='autoPut templateOnClickEdit' _key='active' _html>
	<td class='autoPut templateOnClickEdit' _key='username' _html>
	<td class='autoPut templateOnClickEdit' _key='name' _html>
	<td class='autoPut templateOnClickEdit' _key='company' _html>
	<td class='autoPut templateOnClickEdit' _key='rights' _html>
	<td class='templateOnClickDel ui-icon ui-icon-trash' _html>
</tr>
</table>

