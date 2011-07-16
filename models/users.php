<?

require_once "model.php";

class users extends model
{
	//meta data for users
	private $meta_user=array(
		"_id"=>array(
			"type"=>"id"
		),
		"username"=>array(
			"desc"=>"Username",
			"type"=>"string",
			"max"=>20,
			"min"=>3
		),
		"keutel"=>array(
			"desc"=>"Hoe bruin issie?",
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
			)
		),
		"password"=>array(
			"desc"=>"Passwoord",
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
		),

);


	function getAll()
	{
		$collection = $this->db->users;

		// find everything in the collection
		$cursor=$collection->find();

		return (array(
			"meta"=>$this->meta_user,
			"data"=>$this->run($cursor)
		));
	}

	function get($params)
	{
	
		return (array(
			"meta"=>$this->meta_user,
			"data"=>$this->getById("users",$params['_id']))
		);
	}

	//update/add user
	function put($params)
	{
		$this->verifyMeta($this->meta_user, $params);
	
		if ($params["gender"]=="F" && in_array("admin", $params["rights"]))
			throw new FieldException("Een vrouw kan geen administrator zijn!", "gender");

		//user exists?
		$existing=$this->db->users->findOne(array('username'=>$params['username']));
		
		if ($existing && $existing["_id"]!=$params["_id"])
			throw new FieldException("Gebruiker bestaat al!", "username");
		
		
		$this->setById("users", $params["_id"], $this->meta_user, $params);
	}

}


