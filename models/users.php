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

			/// Authentication stuff
			"username"=>array(
				"desc"=>"Inlog naam",
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
			"password"=>array(
				"desc"=>"Wachtwoord",
				"type"=>"password",
				"min"=>5
			),
			"active"=>array(
				"desc"=>"User mag inloggen",
				"default"=>true,
				"type"=>"bool",
			),

			/// Company stuff
			"company"=>array(
				"desc"=>"Bedrijfsnaam",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"tax"=>array(
				"desc"=>"BTW",
				"type"=>"select",
				"default"=>"0.19",
				"choices"=>array(
					"0.19"=>"19 %",
					"0.6"=>"6 %",
					"0"=>"0 %",
				)
			),

			/// User/Company contact info
			"name"=>array(
				"desc"=>"Voornaam en achternaam",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"address"=>array(
				"desc"=>"Adres",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"city"=>array(
				"desc"=>"Woonplaats",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"postalcode"=>array(
				"desc"=>"Postcode",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"country"=>array(
				"desc"=>"Land",
				"type"=>"select",
				"default"=>"nl",
				"choices"=>array(
					"nl"=>"Nederland",
					"be"=>"Belgie",
					"de"=>"Duitsland",
				)
			),
			"email"=>array(
				"desc"=>"Email address",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"phone"=>array(
				"desc"=>"Telefoonnummer",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),

			/// Invoice contact info
			"invoiceName"=>array(
				"desc"=>"Ter attentie van",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceAddress"=>array(
				"desc"=>"Adres",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCity"=>array(
				"desc"=>"Woonplaats",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePostalcode"=>array(
				"desc"=>"Postcode",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCountry"=>array(
				"desc"=>"Land",
				"type"=>"select",
				"default"=>"nl",
				"choices"=>array(
					"nl"=>"Nederland",
					"be"=>"Belgie",
					"de"=>"Duitsland",
				)
			),
			"invoiceEmail"=>array(
				"desc"=>"Email address",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePhone"=>array(
				"desc"=>"Telefoonnummer",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),

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

		//filtering: only allow filtering on specific fields
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


