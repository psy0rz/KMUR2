<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"> 
<!-- (C)edwin@datux.nl - released under GPL --> 
<html> 
 
<head> 
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"> 
	<title>bwap</title> 
	
	<script type="text/javascript" src="form.js"></script>

	<script>
	$(document).ready(function()
	{
		rpc(
			"users.getAll",
			{
			},
			function(result)
			{
				console.info("eerste result");
			}
		);
		rpc(
			"users.get",
			{
				"_id":$.url().param("_id"),
			},
			function(result)
			{
				console.info("tweede result");
			}
		);
	});
	
	</script>


	<style> 
	</style> 
 
</head> 
 
 
<body style=' 
	'> 

<table _get='users.getAll'>	

</table>

</body> 
</html> 
