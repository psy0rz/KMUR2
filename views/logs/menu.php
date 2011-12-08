<?

$this->addMain("system",array(
	"desc"=>"Systeem",
));

$this->addSub("system","logs",array(
	"desc"=>"Logs",
	"view"=>array(
		"name"=>"logs.list",
		"mode"=>"main"
	)
));

