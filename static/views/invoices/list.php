<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	controlList({
		view		: view,
		id		: '_id',
		getMeta		: 'invoices.getMeta',		
		getMetaParams	: view.params,
		getData		: 'invoices.getAll',
		getDataParams	: view.params,
		delData		: 'invoices.del',
		editView	: {
			name: 'invoices.edit',
			mode: 'main'
		},
		loadCallback: function(result) {
			viewReady({
				view: view,
				title: "Factuur overzicht"
			});
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});
});

</script>


<table >
<tr class='ui-widget-header'>
	<th class='autoMeta controlOnClickOrder controlOrderDesc' _key='number' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='company' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='desc' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='status' _meta='desc'>
	<th>
</tr>
<tr>
	<td><input type='text' class='tempalteOnChangeFilter controlSetFocus' _key='number'>
	<td><input type='text' class='tempalteOnChangeFilter' _key='company'>
	<td><input type='text' class='tempalteOnChangeFilter' _key='desc'>
	<td>
</tr>

<tr class='colorRows autoPut autoListSource ui-widget-content' _key='_id' _value>
	<td class='autoPut control-on-click-edit' _key='number'>
	<td class='autoPut control-on-click-edit' _key='company'>
	<td class='autoPut control-on-click-edit' _key='desc'>
	<td class='autoPut control-on-click-edit' _key='status'>
	<td class='control-on-click-del ui-icon ui-icon-trash'>
</tr>
</table>

