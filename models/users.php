<?

require_once "model.php";

class users extends model
{
	//meta data for users
	private $meta_user=array(
		"username"=>array(
			"desc"=>"Username",
			"type"=>"string",
			"max"=>50
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
		),
		"name"=>array(
			"desc"=>"Voornaam en achternaam",
			"type"=>"string",
			"max"=>50
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
		$this->setById("users", $params["_id"], $this->meta_user, $params);
	}

}


