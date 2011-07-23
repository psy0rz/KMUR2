<?

class userContext
{

	private $context=array(
		"user"		=>"anonymous",
		"rights"	=>array("anonymous")
	);
	

//	function __contructor()
//	{
	
//	}

	function hasRights(array $rights)
	{
		return (array_intersect($rights, $this->$context["rights"]) != array());
	}
	
	function hasRight($right)
	{
		return (in_array($right, $this->$context["rights"]));
	}

	function needRights(array $rights)
	{
		if (!hasRights($rights))
			throw new Exception("U heeft onvoldoende rechten. (".implode(" of ",$rights)." benodigd)");	
	}

	function needRight($right)
	{
		if (!hasRight($right))
			throw new Exception("U heeft onvoldoende rechten. ($right benodigd)");
	}
	
	function change($user, array $rights)
	{
		$this->context["user"]=$user;
		$this->context["rights"]=$rights;
	}
	
	//link this context the global context inside the session
	function linkToSession()
	{
		session_start();
		
		if (!isset($_SESSION['userContext']))
		{
			//no global context, so initalize it with this one
			$_SESSION['userContext']=$this->context;
		}
		
		$this->context=&$_SESSION['userContext'];
	}
} 
