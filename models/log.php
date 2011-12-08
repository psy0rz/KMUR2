<?


class log extends model_Mongo
{
	//array of last logged stuff
	protected $logBuffer;

	//debug buffer: debugging messages during this session are stored here
	protected $debugBuffer;

	function __construct($userContext="")
	{
		parent::__construct($userContext);
		$this->logBuffer=array();
	}

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
			"time"=>array(
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

		$log=array(
				"id"=>$counter["value"],
				"text"=>$params["text"],
				"type"=>$params["type"],
				"time"=>time(),
				"username"=>$this->context->getUser()
			);

		$this->logBuffer[]=$log;

		$this->db->log->insert(
			$log,
			array("safe"=>true)
		);

	}

	//called by rpc.php to get log-events that happend during this session.
	function getLogBuffer()
	{
		return ($this->logBuffer);
	}


	function getDebugBuffer()
	{
		return ($this->debugBuffer);
	}

	function debug($object)
	{
		$debug["object"]=$object;
		$bt=debug_backtrace();
		$debug["line"]=$bt[1]["line"];
		$debug["file"]=$bt[1]["file"];
		$this->debugBuffer[]=$debug;
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


