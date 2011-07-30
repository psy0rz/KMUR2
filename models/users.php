<?

require_once "model.php";

class users extends model
{
	//meta data for users
	function getMeta()
	{
		return (array(
			"_id"=>array(
				"type"=>"id"
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
				"default"=>"sdf",
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


	function getAll()
	{
		$collection = $this->db->users;

		// find everything in the collection
		$cursor=$collection->find();

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

		$this->setById("users", $params["_id"], $params);
	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("users", $params["_id"]);

	}

	function authenticate($params)
	{
		//verify if input is ok
		$this->verifyMeta($params);
		
		//get user
		$user=$this->db->users->findOne(array('username'=>$params['username']));
		
		if (!$user || $user["password"]!=$params["password"] )
			throw new FieldException("Ongeldige gebruikersnaam of wachtwoord", "password");

		if (!$user["active"])
			throw new FieldException("Uw account is uitgeschakeld", "username");
		
		//login validated? change current context
		//dont foget to always give users anonymous rights!
		$user["rights"][]="anonymous";
		$this->context->change($user["username"], $user["rights"]);
	}

}


