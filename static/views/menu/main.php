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
				$(context).autoPut(meta, result.data, null, { 
					'update':true 
				} );
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
	$('[_data]', context).click(function(event)
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
			viewCreate({clear:true},view);
		else
			viewCreate({clear:false},view);
			
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


	//////////////////// visual design stuff:
	
	//a main menu was clicked:
	$('.menuMain', context).click(function(event)
	{
		if ($(this).hasClass("menuMain_Active"))
			return;

		$(".menuMain",context).removeClass("menuMain_Active");
		$(".menuMain",context).addClass("menuMain_Passive");

		$(this).addClass("menuMain_Active");
		$(this).removeClass("menuMain_Passive");
		
		$(".menuMainSubs",context).hide(100);
		$(".menuMainSubs",this).show(100);
	});
	$(".menuMainSubs",context).hide();
	
});

</script>


<div>
	<div class='autoPut autoListHide menuMain menuMain_Passive' _key='main'>
		<div class='menuMainTitle' >
			<span class='ui-icon ui-icon-triangle-1-e menuMain_ActiveHide' style='float:left'></span>
			<span class='ui-icon ui-icon-triangle-1-s menuMain_PassiveHide' style='float:left'></span>
			<span class='autoPut' _key='main.title' _html></span>
		</div>
		<div class='menuMainSubs'>
			<div class='autoPut menuSub autoListHide ' _key='main.items' _data>
				<div class='autoPut' _key='main.items.title' _html  ></div>
			</div>
			<div class='autoPut menuFavorite autoListHide ' _key='main.favorites' _data>
				<div class='autoPut' _key='main.favorites.title' _html  ></div>
			</div>
		</div>
	</div>
</div>