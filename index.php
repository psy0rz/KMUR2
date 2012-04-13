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
			//menuReload();
			viewLoad({
				name: 'menu.main',
				mode: 'existing',
				id: 'viewMenu'				
			});
			
//			$("#themeswitcher").themeswitcher();
			$("#viewLog").click(function(){
				$(this).empty();
			});


		});
	</script>

</head> 
<body class='ui-widget'> 



<div id='views' class='ui-widget' style='
	margin-left:8em;
	margin-top:2em;
	margin-bottom:3em;
'>
</div>



<div id='viewPath' style='
	position:fixed;
	top:0em;
	left:8em;
	right:0em;
	padding-left:1em;
	padding-bottom:0.5em;
	background:white;
	opacity: 0.9;
'>
</div>


<div id='menuHolder' style='
	padding-top: 1em;
	position: fixed;
	top:0em;
	left: 0em;
	bottom:0em;
	width:8em;
	background: #eeeeee;
	border-right-width:2px;
	border-right-style:solid;
'>
	<div id='viewMenu'>
	</div>
	
	<div id='viewLog' style='
	'>
	</div>
</div>



<div id='viewDebug' style='
	position:absolute;
	right:0em;
	top:0em;
	opacity:0.8;
'>
</div>

<div class='viewLoading' style='
	position:fixed;
	right:0em;
	top:0em;
	padding-left:1em;
	padding-right:1em;
	border-style:solid;
'>
	processing...
</div>


</body> 
</html> 
 
