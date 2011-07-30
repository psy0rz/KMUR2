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
				viewAddFavorite({
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
	<td><span class='autoCreate' _key='active' _meta='desc'></span>
	<td><span class='autoCreate' _key='active'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='username' _meta='desc'></span>
	<td><span class='autoCreate' _key='username'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='password' _meta='desc'></span>
	<td><span class='autoCreate' _key='password'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='keutel' _meta='desc'></span>
	<td><span class='autoCreate' _key='keutel'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='rights' _meta='desc'></span>
	<td><span class='autoCreate' _key='rights'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='name' _meta='desc'></span>
	<td><span class='autoCreate' _key='name'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='gender' _meta='desc'></span>
	<td><span class='autoCreate' _key='gender'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='country' _meta='desc'></span>
	<td><span class='autoCreate' _key='country'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='address' _meta='desc'></span>
	<td><span class='autoCreate' _key='address'></span>
</tr>
</table>


<button class='autoClickSave'>Opslaan</button>
<span class='autoError'></span>

