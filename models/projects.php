<?

require_once "model.php";

class projects extends model
{
	function getMeta()
	{
		return (array(
			"_id"=>array(
				"type"=>"id"
			),
			"projectname"=>array(
				"desc"=>"Project naam",
				"type"=>"string",
				"max"=>30,
				"min"=>3
			),
			"status"=>array(
				"desc"=>"Status",
				"type"=>"select",
				"default"=>"active",
				"choices"=>array(
					"active"=>"Actief",
					"done"=>"Afgerond",
					"hold"=>"On hold",
				)
			),
			"desc"=>array(
				"desc"=>"Omschrijving",
				"type"=>"string",
			)
		));
	}

	//acl for users
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),

		));
	}


	function getAll()
	{
		$collection = $this->db->projects;

		// find everything in the collection
		$cursor=$collection->find();

		return ($this->run($cursor));
	}

	function get($params)
	{
	
		if (isset($params['_id']) && $params['_id'])
			$user=$this->getById("projects", $params['_id']);
		else
			$user=null;
	
		return ($user);
	}

	//update/add project
	function put($params)
	{
		$this->verifyMeta($params);
	
		//project exists?
//		$existing=$this->db->projects->findOne(array('projectname'=>$params['projectname']));
		
//		if ($existing && $existing["_id"]!=$params["_id"])
//			throw new FieldException("Project bestaat al!", "projectname");

		$this->setById("projects", $params["_id"], $params);
	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("projects", $params["_id"]);

	}


}


