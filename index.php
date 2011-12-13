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

<!--	<script type="text/javascript"
	src="http://jqueryui.com/themeroller/themeswitchertool/">
	</script>
-->

	<script>

		$(document).ready(function()
		{
			menuReload();
//			$("#themeswitcher").themeswitcher();
			$("#viewLog").click(function(){
				$(this).empty();
			});


		});
	</script>

</head> 
<body class='ui-widget'> 

<?


?>

<div id='menuHolder'>
	<div id='viewMenu'>
	</div>

	<div id='viewLog'>
	</div>
</div>

<div id='viewPath'>
</div>

<div id='views' class='ui-widget'>
</div>

<div id='viewDebug'>
</div>

</body> 
</html> 
 
