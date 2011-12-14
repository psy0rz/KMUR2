<?


class logs extends model_Mongo
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
			"logType"=>array(
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
				"type"=>"time",
			)
		));
	}

	//acl for users
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),
			"getAll"=>array("user"),
			"getMeta"=>array("user")

		));
	}

	function add($params)
	{
		$this->verifyMeta($params);

		$log=array(
				"text"=>$params["text"],
				"logType"=>$params["logType"],
				"time"=>time(),
				"username"=>$this->context->getUser(),
				"userId"=>$this->context->getUserId()
			);

		$this->logBuffer[]=$log;

		$this->db->logs->insert(
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


	function getAll($params)
	{
		if ($this->context->hasRight("admin"))
		{
			//admin sees all
			$cursor=$this->db->logs->find();
		}
		else
		{
			//users only sees own logs
			$cursor=$this->db->logs->find(
				array("userId"=>$this->context->getUserId())
			);
		}

		if (isset($params['sort']))
		{
			//time sorting is too course, so use _id instead
			if (isset($params['sort']['time']))
				$cursor->sort( array("_id"=> $params['sort']['time']) );
			else
				$cursor->sort($params['sort']);
		}

		return ($this->run($cursor));
	}

}


