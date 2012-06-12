<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var view=<?=viewGet()?>;
	
	controlList({
		view		: view,
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
	<th class='autoMeta controlOnClickOrder' _key='stringTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='multiselectTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='passwordTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='booleanTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='floatTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='integerTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='selectTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='dateTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='hashTest' _meta='desc'>
	<th class='autoMeta controlOnClickOrder' _key='arrayTest' _meta='desc'>
	<th>
</tr>

<tr>
	<td><input type='text' class='controlOnChangeFilter controlSetFocus' _key='stringTest'>
	<td>
	<td>
	<td>
	<td>
	<td>
	<td>
	<td>
	<td>
	<td>
</tr>

<tr class='colorRows autoListSource ui-widget-content' _index='_id' >
	<td class='controlOnClickEdit autoPut' _key='stringTest' _html>
	<td class='controlOnClickEdit autoPut' _key='multiselectTest' _html>
	<td class='controlOnClickEdit autoPut' _key='passwordTest' _html>
	<td class='controlOnClickEdit autoPut' _key='booleanTest' _html>
	<td class='controlOnClickEdit autoPut' _key='floatTest' _html>
	<td class='controlOnClickEdit autoPut' _key='integerTest' _html>
	<td class='controlOnClickEdit autoPut' _key='selectTest' _html>
	<td class='controlOnClickEdit autoPut' _key='dateTest' _html>
	<td class='autoPut' _key='hashTest'>
		<ul>
			<li class='controlOnClickEdit autoPut' _key='hashTest.stringTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.multiselectTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.passwordTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.booleanTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.floatTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.integerTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.selectTest' _html>
			<li class='controlOnClickEdit autoPut' _key='hashTest.dateTest' _html _allowTime>
		</ul>
	<td>
		<table class='autoPut autoListSource autoListHide' _key='arrayTest'>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.stringTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.multiselectTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.passwordTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.booleanTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.floatTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.integerTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.selectTest' _html>
			<td class='controlOnClickEdit autoPut' _key='arrayTest.dateTest' _html>
		</table>
	<td class='controlOnClickDel ui-icon ui-icon-trash'>
</tr>
</table>
