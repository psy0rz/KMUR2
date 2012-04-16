<?

class userContext
{

	private $context;
	
	function __construct()
	{
		$this->reset();
	}
	
	
	//clears the context, effectively logging the user out
	function reset()
	{
		$this->context=array(
			"user"		=>"anonymous",
			"rights"	=>array("anonymous"),
			"userId"	=>null
		);
	}
	
	//check if the user has any of the rights (one is enough)
	function hasRights($rights)
	{
//		echo "need:";
//		print_r($rights);
//		echo "has:";
//		print_r($this->context["rights"]);
		return (array_intersect($rights, $this->context["rights"]) != array());
	}
	
	function hasRight($right)
	{
		return (in_array($right, $this->context["rights"]));
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
	
	function change($user, array $rights, $userId)
	{
		$this->context["user"]=$user;
		$this->context["rights"]=$rights;
		$this->context["userId"]=$userId;
	}
	
	//link this context the global context inside the session
	function linkToSession()
	{
		
		
		if (!isset($_SESSION['userContext']))
		{
			//no global context, so initalize it with this one
			$_SESSION['userContext']=$this->context;
		}
		
		$this->context=&$_SESSION['userContext'];
		
	}
	
	function getUser()
	{
		return($this->context["user"]);
	}

	function getUserId()
	{
		return($this->context["userId"]);
	}


} 


