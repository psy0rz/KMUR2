<?

$this->addMain("users",array(
	"desc"=>"Gebruikers",
));

$this->addSub("users","list",array(
	"desc"=>"Overzicht",
	"view"=>array(
		"name"=>"users.list",
		"mode"=>"main"
	)

));


$this->addSub("users","new",array(
	"desc"=>"Nieuw",
	"view"=>array(
		"name"=>"users.edit",
		"mode"=>"popup",
		"viewParams"=>array(
			"_id"=>""
		)
	)
));

$this->addSub("users","login",array(
	"desc"=>"Inloggen",
	"view"=>array(
		"name"=>"users.login",
		"mode"=>"popup",
	)
));



