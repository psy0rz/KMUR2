<?
	// this is just a wrapper that provides a simple log and debug api
	// actual logging is done in the log model

	global $globalLog;

	require("models/logs.php");
	$globalLog=new logs();

	function debug($object)
	{
		global $globalLog;
		$globalLog->debug($object);
	}

	function logger($type,$text)
	{
		global $globalLog;
		$globalLog->add(array(
			"logType"=>$type,
			"text"=>$text
		));
	}
