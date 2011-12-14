<?


class users extends model_Mongo
{
	//meta data for users
	function getMeta()
	{
		return (array(
			"_id"=>array(
				"type"=>"mongoId"
			),
			"username"=>array(
				"desc"=>"Username",
				"type"=>"string",
				"max"=>20,
				"min"=>3
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
			"gender"=>array(
				"desc"=>"Geslacht",
				"type"=>"select",
				"default"=>"M",
				"choices"=>array(
					"M"=>"Man",
					"F"=>"Vrouw",
					"A"=>"Alien",
				)
			),
			"country"=>array(
				"desc"=>"Land",
				"type"=>"select",
				"default"=>"nl",
				"choices"=>array(
					"nl"=>"Nederland",
					"de"=>"Das reich",
					"ov"=>"Overig",
				)
			),
			"password"=>array(
				"desc"=>"Wachtwoord",
				"type"=>"password",
				"min"=>5
			),
			"active"=>array(
				"desc"=>"User mag inloggen",
				"default"=>1,
				"type"=>"bool",
			),
			"name"=>array(
				"desc"=>"Voornaam en achternaam",
				"type"=>"string",
				"min"=>3,
				"max"=>50
			),
			"address"=>array(
				"desc"=>"Adres gegevens",
				"type"=>"string",
			)
		));
	}

	//acl for users
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),
			"authenticate"=>array("anonymous"),
			"getMeta"=>array("anonymous")

		));
	}

	//get usernames indexed by id. (for use in selectboxes)
	//with right you specify which right the users should have.
	//returns:
	// id=>name
	function getNames($params)
	{
		$cursor = $this->db->users->find(array(
			"query"=>array(
				"rights"=>$params["right"]
			),
			"fields"=>array(
				"_id"=>1,
				"name"=>1
			)
		));

		$ret=array();
		foreach ($cursor as $obj) 
		{
			//convert id to normal string rightaway
			$ret[(string)$obj['_id']]=$obj["name"];
		}
		return($ret);
	}


	function getAll($params)
	{
		$collection = $this->db->users;

		// find everything in the collection
		$cursor=$collection->find();

		if (isset($params['sort']))
			$cursor->sort($params['sort']);

		return ($this->run($cursor));
	}

	function get($params)
	{
	
		if (isset($params['_id']) && $params['_id'])
			$user=$this->getById("users",$params['_id']);
		else
			$user=null;
	
		return ($user);
	}

	//update/add user
	function put($params)
	{
		$this->verifyMeta($params);
	
		if ($params["gender"]=="F" && in_array("admin", $params["rights"]))
			throw new FieldException("Een vrouw kan geen administrator zijn!", "gender");

		//user exists?
		$existing=$this->db->users->findOne(array('username'=>$params['username']));
		
		if ($existing && $existing["_id"]!=$params["_id"])
			throw new FieldException("Gebruiker bestaat al!", "username");

		$id=$this->setById("users", $params["_id"], $params);

		//do logging
		$data=$this->getById("users",$id);
		if ($params["_id"])
			logger("info", "Gebruiker ".$data["username"]." gewijzigd.");
		else
			logger("info", "Gebruiker ".$data["username"]." toegevoegd.");

	}

	function del($params)
	{
		$this->verifyMeta($params);
		$data=$this->getById("users",$params["_id"]);
		$this->delById("users", $params["_id"]);
		logger("info", "Gebruiker ".$data["username"]." verwijderd.");
	}

	function authenticate($params)
	{
//HACK		
//$this->context->change("psy", array("anonymous","admin")	);
	
		//verify if input is ok
		$this->verifyMeta($params);
		
		//get user
		$user=$this->db->users->findOne(array('username'=>$params['username']));
		
		if (!$user || $user["password"]!=$params["password"] )
		{
			logger("warning", "Login poging met verkeerd wachtwoord door: ".$params["username"]);
			throw new FieldException("Ongeldige gebruikersnaam of wachtwoord", "password");
		}

		if (!$user["active"])
		{
			logger("warning", "Login poging door uitgeschakelde gebruiker: ".$params["username"]);
			throw new FieldException("Uw account is uitgeschakeld", "username");
		}
		
		//login validated? change current context
		//dont foget to always give users anonymous and user rights!
		$user["rights"][]="anonymous";
		$user["rights"][]="user";
		$this->context->change($user["username"], $user["rights"], $user["_id"]);

		logger("info", "Ingelogd");
	}

}


