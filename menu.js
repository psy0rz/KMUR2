function menuReloadFavorites()
{
	
}


function menuReload()
{
	rpc(
		"menu.get",
		{},
		function (result)
		{
			var menuDiv=$("#viewMenu");
			menuDiv.empty();
			$.each(result['data'], function(mainName,mainMenu)
			{
				var mainMenuDiv=$("<div>")
					.attr("id", "menuMain_"+mainName)
					.addClass("menuMain");
					
				mainMenuDiv.append(
					$("<div>")
						.addClass("menuMainTitle")
						.text(mainMenu["desc"])
				);
				
				var subMenuDiv=$("<div>")
						.addClass("menuMainSubs")
						.hide();
						
				mainMenuDiv.hover(
					function()
					{
						subMenuDiv.show();
					},
					function()
					{
						subMenuDiv.hide();
					}
				);
				
				mainMenuDiv.append(subMenuDiv);
				

				$.each(mainMenu["subs"], function(subName,subMenu)
				{
					if (subMenu.params==null)
					{
						subMenu.params={};
					}
					
					subMenuDiv.append(
						$("<div>")
							.addClass("menuSub")
							.attr("id", "menuSub_"+subName)
							.text(subMenu["desc"])
							.click(function(event) 
							{
								subMenuDiv.hide();
								if (subMenu["mode"] == "popup")
								{
									viewPopup(
										event,
										subMenu["view"],
										subMenu["params"]
									);
								}
								else
								{
									subMenu.params.element="#viewMain";
									viewLoad(
										subMenu["view"],
										subMenu["params"]
									);
								}
							})
					);
				});
			
				menuDiv.append(mainMenuDiv);
			});
		}
	);
}