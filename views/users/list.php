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
			mode: 'popup',
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
	<th class='autoMeta autoOrder' _key='active' _meta='desc'>
	<th class='autoMeta autoOrder autoOrderAsc' _key='username' _meta='desc'>
	<th class='autoMeta autoOrder' _key='name' _meta='desc'>
	<th class='autoMeta autoOrder' _key='gender' _meta='desc'>
	<th class='autoMeta autoOrder' _key='rights' _meta='desc'>
	<th>
</tr>

<tr>
	<td>
	<td><input type='text' class='autoFilter autoFilterFocus' _key='username'>
	<td><input type='text' class='autoFilter' _key='name'>
	<td>
	<td>
</tr>

<tr class='colorRows autoPut autoListSource ui-widget-content' _key='_id' _value>
	<td class='autoPut autoClickEdit' _key='active'>
	<td class='autoPut autoClickEdit' _key='username'>
	<td class='autoPut autoClickEdit' _key='name'>
	<td class='autoPut autoClickEdit' _key='gender'>
	<td class='autoPut autoClickEdit' _key='rights'>
	<td class='autoClickDel ui-icon ui-icon-trash'>
</tr>
</table>

