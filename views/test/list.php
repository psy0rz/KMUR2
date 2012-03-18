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
	<th class='autoMeta templateOnClickOrder' _key='stringTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='multiselectTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='passwordTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='booleanTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='floatTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='integerTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='selectTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='dateTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='arrayTest' _meta='desc'>
	<th class='autoMeta templateOnClickOrder' _key='hashTest' _meta='desc'>
	<th>
</tr>

<tr>
	<td><input type='text' class='templateOnChangeFilter' _key='stringTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='multiselectTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='passwordTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='booleanTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='floatTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='integerTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='selectTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='dateTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='arrayTest'>
	<td><input type='text' class='templateOnChangeFilter' _key='hashTest'>
</tr>

<tr class='colorRows autoListSource ui-widget-content' _index='_id' >
	<td class='autoPut' _key='stringTest' _html>
	<td class='autoPut' _key='multiselectTest' _html>
	<td class='autoPut' _key='passwordTest' _html>
	<td class='autoPut' _key='booleanTest' _html>
	<td class='autoPut' _key='floatTest' _html>
	<td class='autoPut' _key='integerTest' _html>
	<td class='autoPut' _key='selectTest' _html>
	<td class='autoPut' _key='dateTest' _html>
	<td class='autoPut' _key='arrayTest' _html>
	<td class='autoPut' _key='hashTest' _html>
	<td>
</tr>
</table>

