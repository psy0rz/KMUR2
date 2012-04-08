<?


class menu extends model_Mongo
{
	private $tree;
	
	private $meta=array(
		"main"=>array(
			"desc"=>"Main menu items",
			"type"=>"array",
			"meta"=>array(
				"name"=>array(
					"desc"=>"Main menu name",
					"type"=>"string",
				),
				"title"=>array(
					"desc"=>"Main menu title",
					"type"=>"string",
				),
				"items"=>array(
					"desc"=>"Sub menu items",
					"type"=>"array",
					"meta"=>array(
						"title"=>array(
							"desc"=>"Sub menu title",
							"type"=>"string",
						),
						"view"=>array(
							"desc"=>"View data",
							"type"=>"*"
						)
					)
				),
				"favorites"=>array(
					"desc"=>"Favorites",
					"type"=>"array",
					"meta"=>array(
						"title"=>array(
							"desc"=>"Favorite title",
							"type"=>"string",
						),
						"view"=>array(
							"desc"=>"View data",
							"type"=>"*"
						)
					)
				)
			)
		)
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
			"addFavorite"=>array("employee", "admin", "customer"),
			"getFavorites"=>array("employee", "admin", "customer")
		));
	}


	function get()
	{
		//get the tree
		$ret=$this->tree;
		
		
		//get all the favorite items for this user
		$cursor=$this->db->menu->find(array(
			'user' => $this->context->getUser(),
		));
		$cursor->sort(array("timestamp"=>-1));
	
		foreach ($cursor as $item)
		{
			//group items by menu
			if (!isset($ret[$item["menu"]]) || count($ret[$item["menu"]])<10)
			{
				$ret[$item["menu"]]["favorites"][]=$item;
			}
		}
		
		return($ret);
	}

	/*
		'menu':		"users",
		'desc':		"Wijzig "+result.data.username,
		'view':		(same parameters as viewCreate() in view.js)
	*/
	function addFavorite($params)
	{
		
		//update the favorite count in the database
		$this->db->menu->update(
			array(
				'user' => $this->context->getUser(),
				'menu' => $params["menu"],
				'desc' => $params["desc"],
			), 
			array(
				'$set' => array(
					'user' => $this->context->getUser(),
					'menu' => $params["menu"],
					'view' => $params["view"],
					'desc' => $params["desc"],
					'timestamp' => time(),
				),
//				'$inc' => array(
//					'count' => 1
//				)
			),
			array(
				"upsert"=>true,
				"safe"=>true
			)
		);
		
		//get all the items for this users menu
		$cursor=$this->db->menu->find(array(
			'user' => $this->context->getUser(),
			'menu' => $params["menu"],
		));
		$cursor->sort(array("timestamp"=>1));
		
		//too much items?
		$count=$cursor->count();
		while ($count>10)
		{
			//delete the oldest first
			$delete=$cursor->getNext();
			$this->delById("menu",$delete["_id"]);
			$count--;
		}
	}
	
}

