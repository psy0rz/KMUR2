<?
/** RPC wrapper for our model classes.
 Use this to call any method off the classes in our models subdirectory.

*/

require_once("core.php");
require_once("log.php");


$result=array();
try
{
	if (isset($_REQUEST['class']))
		$class=$_REQUEST['class'];
	else
		$class="";
	
	if (isset($_REQUEST['method']))
		$method=$_REQUEST['method'];
	else
		$method="";

	if (isset($_REQUEST['params']))
		$params=json_decode($_REQUEST['params'], true);
	else
		$params=array();

	if ($class=="")
		throw new Exception("class not specified");
	
	if (preg_match('/[^a-zA-Z0-9_]/',$class) > 0)
		throw new Exception("Illegal class name");//dont echo $class!

	$object=new $class();

	if ($method=="")
		throw new Exception("method not specified");

	if (preg_match('/[^a-zA-Z0-9_]/',$method) > 0)
		throw new Exception("Illegal method name");//dont echo $method

	if (!method_exists($object,$method))
		throw new Exception("Method '$method' not found in class '$class'");

	if (!$object->canCall($method))
		throw new Exception("U heeft niet genoeg rechten voor deze functie");

	if (isset($_REQUEST["debuggingEnabled"]))
	{
		global $globalLog;
		$globalLog->debuggingEnabled=$_REQUEST["debuggingEnabled"];
	}
		
	//call it
	$result=array(
		"data"=>$object->$method($params)
	);
}
catch (FieldException $e)
{
	$result=array(
		"error"=>array(
			"message"=>$e->getMessage(),
			"fields"=>$e->getFields(),
		)
	);
}
catch (Exception $e)
{
	$result=array(
		"error"=>array(
			"message"=>$e->getMessage()
		)
	);
}

{
	global $globalLog;

	$buf=$globalLog->getDebugBuffer();
	if ($buf)
		$result["debug"]=$buf;

	$buf=$globalLog->getLogBuffer();
	if ($buf)
		$result["log"]=$buf;

}

echo json_encode($result);
