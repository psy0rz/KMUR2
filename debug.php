<?

	global $gDebugBuffer;

	function debug($object)
	{
		global $gDebugBuffer;
		$debug["object"]=$object;
		$bt=debug_backtrace();
		$debug["line"]=$bt[0]["line"];
		$debug["file"]=$bt[0]["file"];
		$gDebugBuffer[]=$debug;
	}
