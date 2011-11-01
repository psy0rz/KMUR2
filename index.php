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

	<script type="text/javascript"
	src="http://jqueryui.com/themeroller/themeswitchertool/">
	</script>
	<script>
		$(document).ready(function()
		{
			menuReload();
			$("#themeswitcher").themeswitcher();

		});
	</script>

</head> 
<body class='ui-widget'> 

<?


?>

<div id='viewMenu' class=''>

<div style='float:right' id='themeswitcher'></div>
</div>



<div id='viewMain' class='ui-widget-content  menuOffset autoRefresh'>
</div>

</body> 
</html> 
 
