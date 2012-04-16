<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;

	controlForm({
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
			$(document).trigger("menu.reload");
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



<button class='controlOnClickSave'>Login</button>
<span class='viewError'></span>

