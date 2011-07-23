<?
/** RPC wrapper for our model classes.
 Use this to call any method off the classes in our models subdirectory.

*/

require_once("core.php");

$result=array();

try
{
	$class=$_REQUEST['class'];
	$method=$_REQUEST['method'];
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
			"field"=>$e->field,
			"id"=>$e->id
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

echo json_encode($result);
