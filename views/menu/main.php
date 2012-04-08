<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;

	var meta;

	//(re)load the menu
	function menuReload()
	{
		rpc(
			"menu.get",
			{},
			function (result)
			{
			});
	}

	//get menu metadata
	rpc(
		"menu.getMeta",
		{},
		function (result)
		{
			meta=result;
			menuReload();
		});
		
});

</script>



<h1>meanuu</h1>

