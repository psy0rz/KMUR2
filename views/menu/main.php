<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	var context=$("#"+view.id);

	var meta;

	//(re)load the menu
	$(document).on("menu.reload", function(event, params)
	{
		rpc(
			"menu.get",
			{},
			function (result)
			{
				$(context).autoPut(meta, result.data);
			});
	});

	/* add a 'favorite' to the specified menu. automaticly keeps count of most used items.
	parameters:
	{
		'menu':		"users",
		'desc':		"Wijzig "+result.data.username,
		'view':		(view parameters, look at viewCreate in view.js)}
	*/
	$(document).on("menu.addFavorite", function(event, params)
			{
				rpc(
					"menu.addFavorite",
					params,
					function(result)
					{
						$(document).trigger("menu.reload");
					}
				);
			
			});

	//a menu item was clicked:
	$('[_data]', context).click(function()
	{
//		console.log("data ",this, $(this).data("_data"));

		//create the view
		var view={};
		$.extend( view, $(this).data("_data").view);
		view.x=event.clientX;
		view.y=event.clientY;
		if (view.highlight)
			delete view.highlight;

		if (view.mode=='main')
			viewCreate({creator:$(this), clear:true},view);
		else
			viewCreate({creator:$(this), clear:false},view);
			
	});

	//get menu metadata
	rpc(
		"menu.getMeta",
		{},
		function (result)
		{
			meta=result.data;
			$(document).trigger("menu.reload");
		});
		
});

</script>

<div>
	<div class='autoPut menuMain' _key='main'>
		<div class='autoPut menuMainTitle' _key='main.title' _html></div>
		<div class='menuMainSubs'>
			<div class='autoPut menuSub' _key='main.items' _data>
				<div class='autoPut' _key='main.items.title' _html  ></div>
			</div>
		</div>
	</div>
</div>
