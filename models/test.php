<?


class test extends model_Mongo
{

	function getMeta()
	{	
		return(array(
			"_id"=>array(
				"type"=>"mongoId"
			),

			/// Authentication stuff
			"username"=>array(
				"desc"=>"Inlog naam",
				"type"=>"string",
				"max"=>20,
			),
			"rights"=>array(
				"desc"=>"Gebruikers rechten",
				"type"=>"multiselect",
				"default"=>array("customer"),
				//Note: anonymous users have the 'anonymous' right
				//logged in users have the 'anonymous' AND 'user' right, in addition to the rights defined below:
				"choices"=>array(
					"admin"=>"Administrator",
					"employee"=>"Medewerker",
					"customer"=>"Klant",
					"finance"=>"Financieel",
				)
			),
			"password"=>array(
				"desc"=>"Wachtwoord",
				"type"=>"password",
			),
			"active"=>array(
				"desc"=>"User mag inloggen",
				"default"=>true,
				"type"=>"bool",
			),
			"hash"=>array(
					"desc"=>"hash test",
					"type"=>"hash",
					"meta"=>array(
						"username"=>array(
							"desc"=>"hash inlognaam",
							"type"=>"string",
							"max"=>20,
						),
						"bla"=>array(
							"desc"=>"hash bla",
							"type"=>"string",
							"max"=>20,
							),
		
					)
			),
			"array"=>array(
					"desc"=>"array test",
					"type"=>"array",
					"meta"=>array(
						"username"=>array(
							"desc"=>"array inlognaam",
							"type"=>"string",
							"max"=>20,
						),
						"foo"=>array(
							"desc"=>"array foo",
							"type"=>"string",
							"max"=>20,
						),
					)
			),
		));


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

	//update/add user
	function put($params)
	{
		$this->verifyMeta($params);
	
		$id=$this->setById("test", $params["_id"], $params);

		if ($params["_id"])
			logger("info", "test gewijzigd.");
		else
			logger("info", "test toegevoegd.");

	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("test", $params["_id"]);
		logger("info", "test verwijderd.");
	}

}


