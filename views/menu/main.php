<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	var context=$("#"+view.id);

	var meta;

	//(re)load the menu
	function menuReload()
	{
		rpc(
			"menu.get",
			{},
			function (result)
			{
				$(context).autoPut(meta, result.data);
			});
	}

	//get menu metadata
	rpc(
		"menu.getMeta",
		{},
		function (result)
		{
			meta=result.data;
			menuReload();
		});
		
});

</script>

<div>
	<div class='autoPut menuMain' _key='main'>
		<div class='autoPut menuMainTitle' _key='main.title' _html></div>
		<div class='menuMainSubs'>
			<div class='autoPut menuSub' _key='main.items'>
				<div class='autoPut' _key='main.items.title' _html></div>
			</div>
		</div>
	</div>
</div>
