<?

function __autoload($class) 
{
    include_once "$class.php";

	if (!class_exists($class))
		throw new Exception("Class '$class' not found");
}

//throw this if there's something wrong with a field
class FieldException extends Exception
{
	public $field;
	public $id;
	
    // Redefine the exception so message isn't optional
    public function __construct($message, $field, $id='') {
        $this->field=$field;
		$this->id=$id;
		
        // make sure everything is assigned properly
        parent::__construct($message);
    }
}


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
	
	protected function getById($collection,$id)
	{
		return(
			$this->db->$collection->findOne(array('_id'=>new MongoId($id)))
		);
	}

	//compares all the fields in $data to the rules in $meta.
	//data is examined recursively
	//Throws exeception when errors are found
	protected function verifyMeta($meta, $data, $level=0)
	{
		//_id is always used as id.
		$meta["_id"]["type"]="id";
	
		foreach ($data as $key=>$value)
		{
			//FIXME: numeric arrays?
			
			if (!isset($meta[$key]["type"]))
				throw new FieldException("het veld '$key' word niet geaccepteerd", $key);

			if ($meta[$key]["type"]=="id")
			{
				if (!is_scalar($value))
					throw new FieldException("dit veld is geen geldige id", $key);
			}
			else if ($meta[$key]["type"]=="string" || $meta[$key]["type"]=="password")
			{
				if (!is_string($value))
					throw new FieldException("dit veld moet een tekst zijn", $key);
					
				if (isset($meta[$key]["max"]) && strlen($value)>$meta[$key]["max"])
					throw new FieldException("dit veld mag niet langer dan ".$meta[$key]["max"]." karakters zijn", $key);

				if (isset($meta[$key]["min"]) && strlen($value)<$meta[$key]["min"])
					throw new FieldException("dit veld mag niet korter dan ".$meta[$key]["min"]." karakters zijn", $key);
			}
			else if ($meta[$key]["type"]=="integer" || $meta[$key]["type"]=="float")
			{
				if ($meta[$key]["type"]=="integer" || !is_integer($value))
					throw new FieldException("dit veld moet een geheel getal zijn", $key);

				if (isset($meta[$key]["max"]) && $value>$meta[$key]["max"])
					throw new FieldException("dit veld mag niet groter dan ".$meta[$key]["max"]." zijn", $key);

				if (isset($meta[$key]["min"]) && $value<$meta[$key]["min"])
					throw new FieldException("dit veld mag niet kleiner dan ".$meta[$key]["min"]." zijn", $key);
			}
			else if ($meta[$key]["type"]=="array")
			{
//				if (!is_array(value))
	//				throw new FieldException("field '$key' should be an array", $key);
				throw new FieldException("XXX arrays not suppored yet!", $key);
				//recurse
				//verifyMeta($meta, $data, $level+1);
			}
			else
				throw new FieldException("veldtype '".$meta[$key]["type"]."' word niet ondersteund.", $key);
			
		}
	}

	//verifys if data is compatible with meta-data rules
	//if id is set, updates data in collection
	//if id is not set, add data to collection
	protected function setById($collection, $id, $meta, $data)
	{
			$this->verifyMeta($meta, $data);
			
			$this->db->$collection->update(
				array("_id" => new MongoId($id)), 
				array('$set' => $data)
			);
	}

}


