<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var viewParams=<?=viewGetParams()?>;

	templateForm({
		'element'		: viewParams.element,
		'getMeta'		: 'users.getMeta',
		'putData'		: 'users.authenticate',
		'defaultFocus'	: 'username',
		'loadCallback' : function(result)
		{
			viewReady({
				'element': viewParams.element,
				'title': 'Inloggen'
			});
		},
		'saveCallback' : function()
		{
			menuReload();
		}
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



<button class='autoClickSave'>Login</button>
<span class='autoError'></span>

