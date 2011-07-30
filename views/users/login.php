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
		}
	});

});

</script>



<table>
<tr>
	<td><span class='autoCreate' _key='username' _meta='desc'></span>
	<td><span class='autoCreate' _key='username'></span>
</tr>
<tr>
	<td><span class='autoCreate' _key='password' _meta='desc'></span>
	<td><span class='autoCreate' _key='password'></span>
</tr>
</table>



<button class='autoClickSave'>Login</button>
<span class='autoError'></span>

