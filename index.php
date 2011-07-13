<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
	
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<link href="../../css/redmond/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<script type="text/javascript" src="../../lib/jquery.js"></script>
	<script type="text/javascript" src="../../lib/jquery-ui.js"></script>
	<script type="text/javascript" src="../../lib/json2.js"></script>
	<script type="text/javascript" src="../../lib/jquery.cooquery.js"></script>
	<script type="text/javascript" src="../../lib/jquery.url.js"></script>
	<script type="text/javascript" src="../../common.js"></script>
	<script type="text/javascript" src="../../rpc.js"></script>
	<script type="text/javascript" src="../../form.js"></script>

	<style> 
		.errorHighlight
		{
			border-style: solid;
			border-width: 2px;
			border-color: red;
			background: yellow;
			color: red;
		}
		
		.autoList:hover
		{
			background: yellow;
		}
		
		.autoList
		{
			background: #00eeee;
			cursor: pointer;
		}
		
		.autoList:nth-child(2n-1)
		{
			background: #00ffff;
		}
		
		.autoList:nth-child(2n-1):hover
		{
			background: yellow;
		}

	</style> 

</head> 
<body> 

<?
	if (isset($_SERVER["PATH_INFO"]))
		$viewPath=$_SERVER["PATH_INFO"];
	else
		$viewPath="";

	//render menu
	require_once("menu.php");
	$menu=new menu();
	$menu->render($viewPath);

	//determine what view to include
	if ($viewPath)
	{
		$segments=explode("/",$viewPath);
		$module=$segments[1];
		$view=$segments[2];

		if ($module && $view)
		{
			if (preg_match("/[^a-zA-Z0-9]/",$module.$view))
				die("Illegal module or view name!");
			
			echo "<div class='view'>";
			require_once("views/$module/$view.php");
			echo "</div>";
		}
	}

?>
	
</body> 
</html> 
 
