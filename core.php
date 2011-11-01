<?
require_once "exceptions.php";

session_start();


function __autoload($class) 
{
    include_once "models/$class.php";

	if (!class_exists($class))
		throw new Exception("Class '$class' not found");
}

 
function viewPrintHtmlIncludes()
{
	echo '
	<link href="css/redmond/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<script type="text/javascript" src="lib/jquery.js"></script>
	<script type="text/javascript" src="lib/jquery-ui.js"></script>
	<script type="text/javascript" src="lib/json2.js"></script>
	<script type="text/javascript" src="lib/jquery.cooquery.js"></script>
	<script type="text/javascript" src="lib/jquery.url.js"></script>
	<script type="text/javascript" src="lib/jquery.history.js"></script>
	<script type="text/javascript" src="common.js"></script>
	<script type="text/javascript" src="rpc.js"></script>
	<script type="text/javascript" src="form.js"></script>
	<script type="text/javascript" src="view.js"></script>
	<script type="text/javascript" src="menu.js"></script>
	<script type="text/javascript" src="templates.js"></script>
	<link href="default.css" rel="stylesheet" type="text/css"/>
	<link href="views/view.css" rel="stylesheet" type="text/css"/>
	';
	

}


