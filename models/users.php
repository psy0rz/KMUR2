<?

require_once "model.php";

class users extends model
{
	function getAll()
	{
		$collection = $this->db->users;

		// add a record
		$obj = array( "title" => "Calvin and Hobbes", "author" => "Bill Watterson" );
		$collection->insert($obj);

		// add another record, with a different "shape"
		$obj = array( "title" => "XKCD", "online" => true );
		$collection->insert($obj);

		// find everything in the collection
		$cursor=$collection->find();

//		throw new Exception("kutje");
		return ($this->run($cursor));
	}

}


