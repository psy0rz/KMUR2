
<script>
$(this).ready(function()
{
	
	templateForm({
		'parent'		: $("#viewMain"),
		'getMeta'		: 'users.getMeta',
		'putData'		: 'users.authenticate',
		'defaultFocus'	: 'username',
		'loadCallback' : function(result)
		{
			viewReady({
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



<button id='submit'>Login</button>
<span style='color:#ff0000;' id='error'></span>

