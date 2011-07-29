<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
	
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>w0000t</title> 

	<?
		require_once("core.php");
		viewPrintHtmlIncludes();
	?>

	<script>
		$(document).ready(function()
		{
			rpc(
				"menu.get",
				{},
				function (result)
				{
					var menuDiv=$("#viewMenu");
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

		});
	</script>

</head> 
<body> 

<?


?>

<div id='viewMenu' class='ui-widget'>

</div>



<div id='viewMain' class='ui-widget menuOffset autoRefresh'>
</div>

</body> 
</html> 
 
