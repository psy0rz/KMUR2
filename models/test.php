<?


class test extends model_Mongo
{

	function getMeta()
	{	
		$primitiveTypes=array(
			"stringTest"=>array(
				"desc"=>"String test",
				"type"=>"string",
				"max"=>20,
			),
			"multiselectTest"=>array(
				"desc"=>"Multi select test",
				"type"=>"multiselect",
				"default"=>array("second"),
				"choices"=>array(
					"first"=>"First choice",
					"second"=>"Second choice",
					3=>"Third choice (a number)",
					4=>"Forth choice (a number)",
				)
			),
			"passwordTest"=>array(
				"desc"=>"Password test",
				"type"=>"password",
			),
			"booleanTest"=>array(
				"desc"=>"Boolean test",
				"default"=>true,
				"type"=>"bool",
			),
			"floatTest"=>array(
				"desc"=>"Float test",
				"type"=>"float"
			),
			"integerTest"=>array(
				"desc"=>"Integer test",
				"type"=>"integer"
			),
			"selectTest"=>array(
				"desc"=>"Select test",
				"type"=>"select",
				"default"=>array("second"),
				"choices"=>array(
					"first"=>"First choice",
					"second"=>"Second choice",
					3=>"Third choice (a number)",
					4=>"Forth choice (a number)",
				)
			),
			"dateTest"=>array(
				"desc"=>"Date test",
				"type"=>"date"
			),
		
		);
		
		
		$meta=array(
			"_id"=>array(
				"type"=>"mongoId"
			),

			"hashTest"=>array(
				"desc"=>"Hash test",
				"type"=>"hash",
				"meta"=>$primitiveTypes,
			),
			"arrayTest"=>array(
				"desc"=>"array test",
				"type"=>"array",
				"meta"=>$primitiveTypes,
			),
		);

		$meta+=$primitiveTypes;
		
		return($meta);
	}




	function getAll($params)
	{
		return($this->genericGetAll("test",$params));
	}

	function get($params)
	{
	
		if (isset($params['_id']) && $params['_id'])
			$test=$this->getById("test",$params['_id']);
		else
			$test=null;
	
		return ($test);
	}

	function put($params)
	{
		$this->verifyMeta($params);
	
		$ret=$this->setById("test", $params["_id"], $params);

		if ($params["_id"])
			logger("info", "test ".$params['stringTest']." gewijzigd.");
		else
			logger("info", "test ".$params['stringTest']." toegevoegd.");
		
		return($ret);

	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("test", $params["_id"]);
		logger("info", "test ".$params['stringTest']." verwijderd.");
	}

	function getAcl()
	{
		return(array(
				"default"=>array("anonymous")
		));
	}
	
}


