<?

//mongodb specific base model. Extend your model from this one of you want to use MongoDB as backend.
class model_Mongo extends model
{
	protected $mongoObj;
	protected $db;

	function __construct($userContext="")
	{

		parent::__construct($userContext);

		//TODO: use one global mongo connection for optimisation?
		
		// connect
		$this->mongoObj = new Mongo();

		// select a database
		$this->db = $this->mongoObj->kmur;
	}
	
	/** Iterates over a cursor and collects results in a hash array, indexed by _id
	*/
	protected function run($cursor)
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
			throw new Exception("Item $id niet gevonden in collectie $collection");
		
		$ret["_id"]=(string)$ret["_id"];
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
	//if id is set, updates data in collection. throws exception when not found
	//if id is not set, add data to collection
	//on success returns created or updated data and id
	protected function setById($collection, $id, $data, $meta='')
	{
		//always ignore the _id (its not a MongoId object anyway)
		unset($data["_id"]);

		if (!$data)
			return;

		$this->verifyMeta($data, $meta);
		if ($id)
		{
			$mongoId=new MongoId($id);
			$status=$this->db->$collection->update(
				array('_id' => $mongoId), 
				array('$set'=>$data),
				array(
					"safe"=>true
				)
			);
			if (!$status["updatedExisting"])
				throw new Exception("Opgegeven id $id niet gevonden in collectie $collection.");
				
			$data["_id"]=$id;
			return($data);
		}
		else
		{
			$status=$this->db->$collection->insert(
				$data,
				array(
 					"safe"=>true
				)
			);
			$data["_id"]=(string)$data["_id"];
			return($data);
		}
	}
	
	//generic function to get all data and apply filtering and sorting options.
	//we make this protected so that the programmer cant accedently allow this function by using a different getAcl-default-setting.	
	protected function genericGetAll($collectionName,$params)
	{
		
		$collection = $this->db->selectCollection($collectionName);
	
		//filtering
		$filter=array();
		if (isset($params['filter']))
		{
			foreach($params['filter'] as $key=>$value)
			{
				if (isset($params['filter'][$key]))
				$filter[$key]=new MongoRegex("/$value/i");
			}
		}
	
		// find everything in the collection
		$cursor=$collection->find($filter);
	
		if (isset($params['sort']))
		$cursor->sort($params['sort']);
	
		return ($this->run($cursor));
	}
	

}


