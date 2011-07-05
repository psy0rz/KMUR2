<?
/** RPC wrapper for our model classes.
 Use this to call any method off the classes in our models subdirectory.

*/


require_once "models/model.php";

$result=array();

try
{
	$class=$_REQUEST['class'];
	$method=$_REQUEST['method'];
	$params=json_decode($_REQUEST['params'], true);

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
		throw new Exception("Method '$method' not found");
	
	//call it
	$result=array("data"=>$object->$method($params));
}
catch (Exception $e)
{
	$result=array("error"=>$e->getMessage());
}

echo json_encode($result);
