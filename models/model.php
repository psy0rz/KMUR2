<?

require_once("userContext.php");

class model
{
	protected $mongoObj;
	protected $db;

	protected $context;

	function __construct($userContext="")
	{
		//use specified context or session based context?
		if ($userContext)
			$this->context=$userContext;
		else
		{
			$this->context=new userContext();
			$this->context->linkToSession();
		}
		
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



	//compares all the fields in $data to the rules in $meta.
	//data is examined recursively
	//Throws exeception when errors are found
	/*
		Common metadata:
		 type: Type of the field
		 desc: Description of the field (only used by the views)
		 default: Default value of the field (only used by the views)
		 readonly: The value is readonly and cannot be changed by the enduser.
	
		Possible types:
		 "string"/"password": The field is a string.
		   max: If specified, check max length
		   min: If specified, check min length
		 "integer": A whole integer number
		   max: If specified, check max value
		   min: If specified, check min value
		 "float": A floating point number
		   max: If specified, check max value
		   min: If specified, check min value
		 "timestamp": A unix timestamp
		 "bool": Boolean field, can only be 0 or 1.
		 "hash": Another hash array. All the fields will be checked recursively against specified metadata.
		  meta: Metadata to check against. (same format as this metadata)
		 "array": An subarray of items. All the fields within the items will be checked recursively against specified metadata.
		  meta: Metadata to check against. (same format as this metadata)
		 "select": A select list that allows user to select one option.
		  choices: A hasharray with the allowed options. option=>description.
		 "multiselect": A select list that allows user to select multiple options.
		  choices: A hasharray with the allowed options. option=>description.
		 "id": A mongoDB identifier.
		 "*": Allow anything and dont check it. dont forget to check it yourself!
	*/

	protected function verifyMeta($data, $meta='')
	{
		if (!$meta)
		{
			$meta=$this->getMeta();
		}
	
		foreach ($data as $key=>$value)
		{
			
			if (!isset($meta[$key]["type"]))
				throw new FieldException("het veld '$key' word niet geaccepteerd", $key);

			if (isset($meta[$key]["readonly"]) && $meta[$key]["readonly"])
				throw new FieldException("dit veld mag niet gewijzigd worden", $key);

			if ($meta[$key]["type"]=="string" || $meta[$key]["type"]=="password")
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
				if (($meta[$key]["type"]=="integer") && ( (string)(int)$value!=(string)$value ))
					throw new FieldException("dit veld moet een geheel getal zijn", $key);

				if (($meta[$key]["type"]=="float") && ( (string)(float)$value!=(string)$value ))
					throw new FieldException("dit veld moet een getal zijn", $key);

				if (isset($meta[$key]["max"]) && $value>$meta[$key]["max"])
					throw new FieldException("dit veld mag niet groter dan ".$meta[$key]["max"]." zijn", $key);

				if (isset($meta[$key]["min"]) && $value<$meta[$key]["min"])
					throw new FieldException("dit veld mag niet kleiner dan ".$meta[$key]["min"]." zijn", $key);
			}
			//boolean is always 0 or 1
			else if ($meta[$key]["type"]=="bool")
			{
				if (!is_int($value) || ($value!=0 && $value!=1))
					throw new FieldException("dit veld mag alleen 0 of 1 zijn.", $key);
			}
			else if ($meta[$key]["type"]=="timestamp")
			{
				if (!is_int($value) || $value<0)
					throw new FieldException("ongeldige unix timestamp", $key);
			}
			//another hash array, examine it recursively
			else if ($meta[$key]["type"]=="hash")
			{
				if (!is_array($value))
					throw new FieldException("dit veld dient een hash-array te zijn", $key);
				
				try
				{
					$this->verifyMeta($value,$meta[$key]["meta"]);
				}
				catch(FieldException $e)
				{
					//make sure the fieldlist is ok, so the userinterface can highlight the correct field.
					$e->insertField($key);
					throw $e;
				}
			}
			//normal array, examine every item recursively
			else if ($meta[$key]["type"]=="array")
			{
				if (!is_array($value))
					throw new FieldException("dit veld dient een array te zijn", $key);
				$fieldIndex=0;
				foreach ($value as $subData)
				{
					try
					{
						$this->verifyMeta($subData, $meta[$key]["meta"]);
					}
					catch(FieldException $e)
					{
						//make sure the fieldlist is ok, so the userinterface can highlight the correct field.
						$e->insertField($fieldIndex);
						$e->insertField($key);
						throw $e;
					}
					$fieldIndex++;
				}
			}
			//a select list should contain one 'selected' choice from a list
			else if ($meta[$key]["type"]=="select")
			{
				if (!isset($meta[$key]["choices"][$value]))
					throw new FieldException("'$value' is geen geldige optie", $key);
			}
			//same as select but with multiple choices
			else if ($meta[$key]["type"]=="multiselect")
			{
				if (!is_array($value))
					throw new FieldException("verwacht lijst met geselecteerde opties", $key);

				foreach ($value as $choice)
				{
					if (!isset($meta[$key]["choices"][$choice]))
						throw new FieldException("'$value' is geen geldige optie", $key);
				}
			}
			else if ($meta[$key]["type"]=="id")
			{
				if ($value!="" && $value!=new MongoId($value))
					throw new FieldException("'$value' is geen geldig id", $key);
			}
			else if ($meta[$key]["type"]=="*")
			{
				//any data allowed, dont check it!
			}
			//date (always as unix timestamp)
			else if ( ($meta[$key]["type"]=="date") || ($meta[$key]["type"]=="time"))
			{
				if (( (string)(int)$value!=(string)$value ) || ($value<0))
					throw new FieldException("dit is geen geldige unix timestamp", $key);

			}
			else
				throw new FieldException("veldtype '".$meta[$key]["type"]."' word niet ondersteund.", $key);
			
		}
	}

	//verifys if data is compatible with getMeta() rules
	//if id is set, updates data in collection
	//if id is not set, add data to collection
	protected function setById($collection, $id, $data)
	{
			//dont set the id (its not a MongoId object anyway)
			unset($data["_id"]);

			$this->verifyMeta($data);
			$this->db->$collection->update(
				array('_id' => new MongoId($id)), 
				array('$set'=>$data),
				array(
					"upsert"=>true,
					"safe"=>true
				)
			);
	}

	function canCall($function)
	{
		$acl=$this->getAcl();
		
		if (isset($acl[$function]))
			return($this->context->hasRights($acl[$function]));
		else
			return($this->context->hasRights($acl["default"]));
	}

	function getAcl()
	{
		return(array(
			"default"=>array("admin")
		));
	}
	
	//get meta data of this model
	function getMeta()
	{
		return (array());
	}
}


