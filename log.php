<?

	global $globalLog;

	$globalLog=new log();

	function debug($object)
	{
		global $globalLog;
		$globalLog->debug($object);
	}

	function logger($type,$text)
	{
		global $globalLog;
		$globalLog->add(array(
			"type"=>$type,
			"text"=>$text
		));
	}
