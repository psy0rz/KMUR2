<?

//mongodb specific base model. Extend your model from this one of you want to use MongoDB as backend.
class model_Mongo extends model
{
	protected $mongoObj;
	protected $db;

	function __construct($userContext="")
	{

		parent::__construct($userContext);

		
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
		$ret=array();
		foreach ($cursor as $obj) 
		{
			//convert id to normal string rightaway
			$id="";
			$obj['_id']=(string)$obj['_id'];
			$ret[]=$obj;
		}
		return ($ret);
	}
	
	protected function getById($collection,$id)
	{
		$ret=$this->db->$collection->findOne(array('_id'=>new MongoId($id)));
		if ($ret==null)
			throw new Exception("Item niet gevonden in database");
		return ($ret);
	}

	protected function delById($collection,$id)
	{
		return (
			$this->db->$collection->remove(
				array('_id' => new MongoId($id)),
				array("safe"=>true)
			)
		);
	}




	//verifys if data is compatible with getMeta() rules
	//if id is set, updates data in collection
	//if id is not set, add data to collection
	protected function setById($collection, $id, $data, $meta='')
	{
			//dont set the id (its not a MongoId object anyway)
			unset($data["_id"]);

			if (!$data)
				return;

			$this->verifyMeta($data, $meta);
			$this->db->$collection->update(
				array('_id' => new MongoId($id)), 
				array('$set'=>$data),
				array(
					"upsert"=>true,
					"safe"=>true
				)
			);
	}

}


