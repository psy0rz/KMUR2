<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	controlList({
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
	<th class='autoMeta controlOnClickOrder' _key='active' _meta='desc'>
	<th class='autoMeta controlOnClickOrder controlOrderAsc' _key='username' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='name' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='company' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='rights' _meta='desc'>
	<th>
</tr>

<tr>
	<td>
	<td><input type='text' class='controlOnChangeFilter controlSetFocus' _key='username'>
	<td><input type='text' class='controlOnChangeFilter' _key='name'>
	<td><input type='text' class='controlOnChangeFilter' _key='company'>
	<td>
</tr>

<tr class='colorRows autoListSource ui-widget-content' _index='_id'>
	<td class='autoPut controlOnClickEdit' _key='active' _html>
	<td class='autoPut controlOnClickEdit' _key='username' _html>
	<td class='autoPut controlOnClickEdit' _key='name' _html>
	<td class='autoPut controlOnClickEdit' _key='company' _html>
	<td class='autoPut controlOnClickEdit' _key='rights' _html>
	<td class='controlOnClickDel ui-icon ui-icon-trash' _html>
</tr>
</table>

