<?

require_once "model.php";

class menu extends model
{
	private $tree;
	
	private $meta=array(
		"_id"=>array(
			"type"=>"id"
		),
		"menu"=>array(
			"desc"=>"Menu naam",
			"type"=>"string",
			"max"=>20,
			"min"=>1
		),
		"view"=>array(
			"desc"=>"View naam",
			"type"=>"string",
			"max"=>20,
			"min"=>1
		),
		"mode"=>array(
			"desc"=>"Modus",
			"type"=>"string",
			"max"=>20,
			"min"=>1
		),
		"params"=>array(
			"desc"=>"View parameters",
			"type"=>"*",
		),
		"desc"=>array(
			"desc"=>"Menu titel",
			"type"=>"string",
			"max"=>40,
			"min"=>1
		),
	);
	
	function __construct()
	{
		parent::__construct();
		
		$viewDir="views";
		//load the menu
		$dirs=scandir($viewDir);
		foreach ($dirs as $dir)
		{
			if ($dir!="." && $dir!=".." && is_dir("$viewDir/$dir"))
			{
				require_once("$viewDir/$dir/menu.php");
			}
		}
	}

	function addMain($main,$params)
	{
		if (isset($this->tree["$main"]))
			$this->tree["$main"]=$params;
		else
			$this->tree["$main"]=$params;
	}
	
	function addSub($main, $sub, $params)
	{
		$this->tree["$main"]["subs"][$sub]=$params;
	}
	
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),
			"get"=>array("anonymous"),
			"addFavorite"=>array("employee", "admin", "customer")
		));
	}


	function get()
	{
		return($this->tree);
	}

	/*
		'menu':		"users",
		'desc':		"Wijzig "+result.data.username,
		'view':		"users.edit",
		'params':	viewParams,
		'mode':		"popup"
	*/
	function addFavorite($params)
	{
		$this->db->"menu"->update(
			array(
				'user' => $this->context->getUser(),
				'menu' => $params["menu"],
				'view' =>
			), 
			array(
				'$set' => array(
					'user' => $this->context->getUser(),
					'desc' => $parms["desc"]
				)
			),
			array("upsert"=>true)
		);
	}
}

