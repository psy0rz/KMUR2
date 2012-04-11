<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	templateList({
		view		: view,
		id		: '_id',
		getMeta		: 'logs.getMeta',
		getMetaParams	: view.params,
		getData		: 'logs.getAll',
		getDataParams	: view.params,
		delData		: null,
		editView	: {
			name: null,
			mode: null,
			params: view.params,
		},
		loadCallback: function(result) {
			viewReady({
				view: view,
				title: "Log overzicht"
			});
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});
});

</script>


<table >
<tr class='ui-widget-header'>
	<th class='autoMeta templateOnClickOrder templateOrderDesc' _key='time' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='username' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='logType' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='text' _meta='desc'>

</tr>
<tr>
	<td>
	<td><input type='text' class='templateOnChangeFilter' _key='username'>
	<td>
	<td><input type='text' class='templateOnChangeFilter templateSetFocus' _key='text'>
</tr>
<tr class='colorRows autoListSource ui-widget-content'>
	<td class='autoPut' _key='time' _html>
	<td class='autoPut' _key='username' _html>
	<td class='autoPut' _key='logType' _html>
	<td class='autoPut' _key='text' _html>
</tr>
</table>

