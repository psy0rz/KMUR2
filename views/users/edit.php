<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var viewParams=<?=viewGetParams()?>;
	templateForm({
		'element'		: viewParams.element,
		'getMeta'		: 'users.getMeta',
		'getData'		: 'users.get',
		'viewParams' 	: viewParams,
		'putData'		: 'users.put',
		'putParams'		: { "_id": viewParams._id },
		'defaultFocus'	: 'username',
		'loadCallback'	: function(result) {
			if (viewParams._id)
			{
				title="Wijzigen gebruiker "+result.data.username;
				menuAddFavorite({
					'menu':		"users",
					'desc':		"Wijzig "+result.data.username,
					'view':		"users.edit",
					'params':	viewParams,
					'mode':		"popup"
				});
			}
			else
				title="Nieuwe gebruiker";
				
			viewReady({
				'element':viewParams.element,
				'title':title
			});
			
		},
		'errorCallback'	: function(result) { },
		'saveCallback'	: function(result) { }
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

