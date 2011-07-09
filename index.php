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
	</style> 

</head> 
<body> 

<?
	//determine what view to include
	$segments=explode("/",$_SERVER["PATH_INFO"]);
	$module=$segments[1];
	$view=$segments[2];

	if (preg_match("/[^a-zA-Z0-9]/",$module.$view))
		die("Illegal module or view name!");
		
	if (!$module || !$view)
		die("Specify module and view!");

	require_once("views/$module/$view.php");

?>
	
</body> 
</html> 
 
