

function menuReload()
{
	rpc(
		"menu.get",
		{},
		function (result)
		{
			var menuDiv=$("#viewMenu");
			menuDiv.empty();

			if ('error' in result)
			{
					viewShowError(result, menuDiv);
					return;
			}
			
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
				

				var addFunc=function(subName,subMenu)
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
								
								//create the view
								var view={};
								$.extend( view, subMenu.view );
								view.x=event.clientX;
								view.y=event.clientY;
								viewCreate(view);

							})
					);
				};

				//add submenus
				$.each(mainMenu["subs"], addFunc);
			
				//add favorites?
				if ("favorites" in mainMenu)
				{
					subMenuDiv.append(
						$("<div>")
							.addClass("menuSeperator")
						);
					$.each(mainMenu["favorites"], addFunc);
					
				}
				
				menuDiv.append(mainMenuDiv);
			});
		}
	);
}


/* add a 'favorite' to the specified menu. automaticly keeps count of most used items.
parameters:
{
	'menu':		"users",
	'desc':		"Wijzig "+result.data.username,
	'view':		(view parameters, look at viewCreate in view.js)}
*/
function menuAddFavorite(params)
{
	rpc(
		"menu.addFavorite",
		params,
		function(result)
		{
			menuReload();
		}
	);
	
}

