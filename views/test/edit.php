<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	templateForm({
		view			: view,
		getMeta			: 'test.getMeta',
		getMetaParams		: view.params,
		getData			: 'test.get',
		getDataParams		: view.params,
		putData			: 'test.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: [ "username" ],
		closeAfterSave	: false,
		loadCallback	: function(result) {
			if (view.params._id)
			{
				title="Wijzigen test "+result.data.username;
				menuAddFavorite({
					menu:		"test",
					desc:		"Wijzig "+result.data.username,
					view:		view
				});
			}
			else
				title="Nieuwe test";
				
			viewReady({
				view: view,
				title:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});

});

</script>

<fieldset style='display:inline-block;'>
	<legend>Inlog gegevens</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='active' _meta='desc'>
			<td class='autoMeta' _key='active'>
		</tr>
		<tr>
			<td class='autoMeta' _key='username' _meta='desc'>
			<td class='autoMeta' _key='username'>
		</tr>
		<tr>
			<td class='autoMeta' _key='password' _meta='desc'>
			<td class='autoMeta' _key='password'>
		</tr>
		<tr>
			<td class='autoMeta' _key='rights' _meta='desc'>
			<td class='autoMeta' _key='rights'  style='background:#eeffee;'>
		</tr>
	</table>
</fieldset>

<fieldset style='display:inline-block;' class='autoMeta' _key='hash'>
	<legend>hash test</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='hash.username' _meta='desc'>
			<td class='autoMeta' _key='hash.username'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hash.bla' _meta='desc'>
			<td class='autoMeta' _key='hash.bla'>
		</tr>
	</table>
</fieldset>

<fieldset  style='display:inline-block;' >
	<legend>Array test</legend>
	<table>
		<thead>
			<tr class='ui-widget-header autoMeta' _key='array'>
				<th class='autoMeta' _key='array.username' _meta='desc'>
				<th class='autoMeta' _key='array.foo' _meta='desc'>
			</tr>
		</thead>
		<tbody>
			<tr class='autoMeta autoListSource templateOnFocusAdd colorRows ui-widget-content' _key='array'>
				<td class='autoMeta' _key='array.username'>
				<td class='autoMeta' _key='array.foo'>
			</tr>
		</tbody>
	</table>
</fieldset>

<button class='templateOnClickSave' style='display:block'>Opslaan</button>
<span class='viewError'></span>

