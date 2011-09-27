<?

$this->addMain("users",array(
	"desc"=>"Gebruikers",
));

$this->addSub("users","list",array(
	"desc"=>"Overzicht",
	"view"=>"users.list",
));


$this->addSub("users","new",array(
	"desc"=>"Nieuw",
	"view"=>"users.edit",
	"params"=>array(
		"_id"=>""
	),
	"mode"=>"popup",
));

$this->addSub("users","login",array(
	"desc"=>"Inloggen",
	"view"=>"users.login",
	"mode"=>"popup",
));



