<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	var context="#"+view.id;
 
	viewReady({
		'view': view,
		'title': 'Uitloggen'
	});

	$(".cancel", context).click(function()
	{
		viewClose(view);
	});

	$(".logOut", context).click(function()
	{
		rpc("users.logout",{},function()
		{
			$(document).trigger("menu.reload");
			viewCloseAll();
		});
	});
	
});

</script>


Wilt u uitloggen?
<p>

<button class='logOut'>Uitloggen</button>
<button class='cancel'>Annuleren</button>

<span class='viewError'></span>

