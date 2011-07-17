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
			viewLoad($("#viewMain"), "users.list");
//			$("#test").click(function()
	//		{
		//		console.log("klik");
			//	$("#viewMain").html("WEG");
			
			//});
		});
	</script>

</head> 
<body> 

<?

	//render menu
	require_once("menu.php");
	$menu=new menu();
	$menu->render(viewGetPath());

	
//	viewLoad(viewGetPath());

?>
<div id='viewMain'>
</div>

</body> 
</html> 
 
