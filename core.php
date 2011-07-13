<?
require_once "exceptions.php";



function __autoload($class) 
{
    include_once "models/$class.php";

	if (!class_exists($class))
		throw new Exception("Class '$class' not found");
}

 
function printHtmlIncludes()
{
	echo '
	<link href="../../css/redmond/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<script type="text/javascript" src="../../lib/jquery.js"></script>
	<script type="text/javascript" src="../../lib/jquery-ui.js"></script>
	<script type="text/javascript" src="../../lib/json2.js"></script>
	<script type="text/javascript" src="../../lib/jquery.cooquery.js"></script>
	<script type="text/javascript" src="../../lib/jquery.url.js"></script>
	<script type="text/javascript" src="../../common.js"></script>
	<script type="text/javascript" src="../../rpc.js"></script>
	<script type="text/javascript" src="../../form.js"></script>
	<link href="../../default.css" rel="stylesheet" type="text/css"/>
	';
}

function getViewPath()
{
	if (isset($_SERVER["PATH_INFO"]))
		$viewPath=$_SERVER["PATH_INFO"];
	else
		$viewPath="";
		
	return($viewPath);
}


function loadView($viewPath)
{
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
}