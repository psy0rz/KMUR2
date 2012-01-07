<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	templateForm({
		view			: view,
		getMeta			: 'users.getMeta',
		getMetaParams		: view.params,
		getData			: 'users.get',
		getDataParams		: view.params,
		putData			: 'users.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: [ "username" ],
		loadCallback	: function(result) {
			if (view.params._id)
			{
				title="Wijzigen gebruiker "+result.data.username;
				menuAddFavorite({
					menu:		"users",
					desc:		"Wijzig "+result.data.username,
					view:		view
				});
			}
			else
				title="Nieuwe gebruiker";
				
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
	<td class='autoMeta' _key='rights'>
</tr>
<tr>
	<td class='autoMeta' _key='name' _meta='desc'>
	<td class='autoMeta' _key='name'>
</tr>
<tr>
	<td class='autoMeta' _key='gender' _meta='desc'>
	<td class='autoMeta' _key='gender'>
</tr>
<tr>
	<td class='autoMeta' _key='country' _meta='desc'>
	<td class='autoMeta' _key='country'>
</tr>
<tr>
	<td class='autoMeta' _key='address' _meta='desc'>
	<td class='autoMeta' _key='address'>
</tr>
</table>


<button class='autoClickSave'>Opslaan</button>
<span class='autoError'></span>

