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
	<th class='autoMeta autoOrder autoOrderDesc' _key='time' _meta='desc'>
	<th class='autoMeta autoOrder' _key='username' _meta='desc'>
	<th class='autoMeta autoOrder' _key='logType' _meta='desc'>
	<th class='autoMeta autoOrder' _key='text' _meta='desc'>
</tr>

<tr class='colorRows autoPut autoListSource ui-widget-content' _key='_id' _value>
	<td class='autoPut' _key='time'>
	<td class='autoPut' _key='username'>
	<td class='autoPut' _key='logType'>
	<td class='autoPut' _key='text'>
</tr>
</table>

