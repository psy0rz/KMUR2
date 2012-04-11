<?


class menu extends model_Mongo
{
	private $tree;

	function getMeta()
	{
		return(array(
			"main"=>array(
				"desc"=>"Main menu items",
				"type"=>"array",
				"meta"=>array(
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
		));
	}
	
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
	
	function addSub($main, $params)
	{
		$this->tree["$main"]["items"][]=$params;
	}
	
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),
			"get"=>array("anonymous"),
			"getMeta"=>array("anonymous"),
			"addFavorite"=>array("employee", "admin", "customer"),
			"getFavorites"=>array("employee", "admin", "customer")
		));
	}


	function get()
	{
		//get all the favorite items for this user
		$cursor=$this->db->menu->find(array(
			'user' => $this->context->getUser(),
		));
		$cursor->sort(array("timestamp"=>-1));
	
		//group items by menu
		$menu=$this->tree;
		foreach ($cursor as $item)
		{
			if (!isset($menu[$item["menu"]]["favorites"]) || count($menu[$item["menu"]]["favorites"])<10)
			{
				$menu[$item["menu"]]["favorites"][]=$item;
			}
		}
		
		//transform the tree into a format that works better in our javascript framework
		return(array("main"=>array_values($menu)));
	}

	/*
		'menu':		"users",
		'title':		"Wijzig "+result.data.username,
		'view':		(same parameters as viewCreate() in view.js)
	*/
	function addFavorite($params)
	{
		
		//update the favorite count in the database
		$this->db->menu->update(
			array(
				'user' => $this->context->getUser(),
				'menu' => $params["menu"],
				'title' => $params["title"],
			), 
			array(
				'$set' => array(
					'user' => $this->context->getUser(),
					'menu' => $params["menu"],
					'view' => $params["view"],
					'title' => $params["title"],
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

