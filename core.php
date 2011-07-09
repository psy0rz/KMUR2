<?
require_once "exceptions.php";



function __autoload($class) 
{
    include_once "models/$class.php";

	if (!class_exists($class))
		throw new Exception("Class '$class' not found");
}

 
