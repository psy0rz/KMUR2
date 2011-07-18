<?

class menu
{
	private $tree;
	
	function __construct()
	{
		//load the menu
		$dirs=scandir("views");
		foreach ($dirs as $dir)
		{
			if ($dir!="." && $dir!=".." && is_dir("views/$dir"))
			{
				require_once("views/$dir/menu.php");
			}
		}
	}

	function addMain($main,$params)
	{
		$this->tree["$main"]["params"]=$params;
	}
	
	function addSub($main, $sub, $params)
	{
		$this->tree["$main"]["subs"][$sub]=$params;
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

