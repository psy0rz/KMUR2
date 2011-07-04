<?

class model
{
	protected $mongoObj;
	protected $db;

	function __construct()
	{
		// connect
		$this->mongoObj = new Mongo();

		// select a database
		$this->db = $this->mongoObj->kmur;
	}
	
	/** Iterates over a cursor and collects results in a hash array, indexed by _id
	*/
	function run($cursor)
	{
		//iterate through the results
		foreach ($cursor as $obj) 
		{
			$ret[$cursor->key()]=$obj;
		}
		return ($ret);
	}

}


