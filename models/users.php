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
				"choices"=>array(
					"admin"=>"Administrator",
					"employee"=>"Medewerker",
					"customer"=>"Klant",
				)
			),
			"gender"=>array(
				"desc"=>"Geslacht",
				"type"=>"select",
				"choices"=>array(
					"M"=>"Man",
					"F"=>"Vrouw",
					"A"=>"Alien",
				)
			),
			"country"=>array(
				"desc"=>"Land",
				"type"=>"select",
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
			"authenticate"=>array("anonymous")
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
			$user="";
	
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
	
	function authenticate($params)
	{
		//verify if input is ok
		$this->verifyMeta($params);
		
		//get user
		$user=$this->db->users->findOne(array('username'=>$params['username']));
		
		if (!$user || $user["password"]!=$params["password"] )
			throw new FieldException("Ongeldige gebruikersnaam of wachtwoord", "password");
		
		//login validated? change current context
		$this->context->change($user["username"], $user["rights"]);
	}

}


