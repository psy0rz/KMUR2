<?

class menu
{
	private $tree;
	
	function __construct()
	{
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
	
	function get()
	{
		return($this->tree);
	}
	
	function render($path)
	{
		return ; //OBSOLETE
		echo "<div class='menu'>";
		foreach ($this->tree as $main=>$mainData)
		{
			echo "<div class='menuMain'>";
			
				//build list of <a> elements to actual pages for this main menu:
				$selectedClass="";
				$subHtml="";
				foreach ($mainData["subs"] as $sub=>$subData)
				{
					if ($subData["path"]==$path)
					{
						$selectedClass="menuMainSelected";
						$subHtml.="<a class='menuSubDesc menuSubSelected' ";
					}
					else
					{
						$subHtml.="<a class='menuSubDesc' ";
					}
					$subHtml.="href='../../index.php".$subData["path"]."' >";
					$subHtml.=$subData["desc"];
					$subHtml.="</a>";
				}

				echo "<div class='menuMainDesc $selectedClass'>".$mainData["params"]["desc"]."</div>";
				echo "<div class='menuSub'>";
				echo $subHtml;
				echo "</div>";
			echo "</div>";
		}
		echo "</div>";
	}
	
}

