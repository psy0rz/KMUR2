<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	templateList({
		view		: view,
		id			: '_id',
		getMeta		: 'users.getMeta',		
		getData		: 'users.getAll',
		delData		: 'users.del',
		editView		: {
			name: 'users.edit',
			mode: 'popup'
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
	<th class='autoMeta' _key='active' _meta='desc'>
	<th class='autoMeta' _key='username' _meta='desc'>
	<th class='autoMeta' _key='name' _meta='desc'>
	<th class='autoMeta' _key='gender' _meta='desc'>
	<th class='autoMeta' _key='rights' _meta='desc'>
	<th>
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

