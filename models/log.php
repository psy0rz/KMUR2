<?


class log extends model_Mongo
{
	//meta data for users
	function getMeta()
	{
		return (array(
			"_id"=>array(
				"type"=>"mongoId"
			),
			"username"=>array(
				"desc"=>"Gebruiker",
				"type"=>"string",
			),
			"type"=>array(
				"desc"=>"Log soort",
				"type"=>"select",
				"choices"=>array(
					"info"=>"Info",
					"warning"=>"Waarschuwing",
					"error"=>"Fout",
				)
			),
			"text"=>array(
				"desc"=>"Log text",
				"type"=>"string",
			),
			"date"=>array(
				"desc"=>"Tijd",
				"type"=>"date",
			),
		));
	}

	//acl for users
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),

		));
	}

	function add($params)
	{
		$this->verifyMeta($params);

		//get/update counter value
		$counter=$this->db->settings->update(
			array("key" => "logCounter"), 
			array('$inc' => array("value" => 1)), 
			array("upsert" => true)
		);

		$this->db->log->insert(
			array(
				"id"=>$counter["value"],
				"date"=>time(),
				"text"=>$params["text"],
				"type"=>$params["type"],
				"username"=>$this->context->getUser()
			),
			array("safe"=>true)
		);
	}

	function info($text)
	{
		$this->add(array(
			"type"=>"info",
			"text"=>$text
		));
	}

	function getAll()
	{
		return $this->run(
			$this->db->log->find()->sort(
				array("id"=>1)
			)
		);
	}

}


