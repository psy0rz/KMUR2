<?

$this->addMain("system",array(
	"title"=>"Systeem",
));

$this->addSub("system",array(
	"title"=>"Logs",
	"view"=>array(
		"name"=>"logs.list",
		"mode"=>"main",
// 		"params"=>array(
// 			"limit"=>100
// 		)
	)
));

