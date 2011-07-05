<?

require_once "model.php";

class users extends model
{
	function getAll()
	{
		$collection = $this->db->users;

		// add a record
		$obj = array( 
			"title" => "Calvin and Hobbes", 
			"author" => "Bill Watterson",
			"name" => "edwin",
			"price" =>12,0,
			"btw" => 19,
			"payment"=>"open",
			
			);
		$collection->insert($obj);


		// find everything in the collection
		$cursor=$collection->find();

//		throw new Exception("kutje");
		return ($this->run($cursor));
	}

	function get($params)
	{
		return ($this->getById("users",$params['_id']));
	}


}


