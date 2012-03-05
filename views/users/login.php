<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;

	templateForm({
		'view'			: view,
		'getMeta'		: 'users.getMeta',
		'putData'		: 'users.authenticate',
		'defaultFocus'	: ['username'],
		'loadCallback' : function(result)
		{
			viewReady({
				'view': view,
				'title': 'Inloggen'
			});
		},
		'saveCallback' : function()
		{
			menuReload();
		},
		'closeAfterSave': true
	});

});

</script>



<table>
<tr>
	<td class='autoMeta' _key='username' _meta='desc'>
	<td class='autoMeta' _key='username'>
</tr>
<tr>
	<td class='autoMeta' _key='password' _meta='desc'>
	<td class='autoMeta' _key='password'>
</tr>
</table>



<button class='templateOnClickSave'>Login</button>
<span class='viewError'></span>

