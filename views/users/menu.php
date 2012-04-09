<?

$this->addMain("users",array(
	"title"=>"Gebruikers",
));

$this->addSub("users",array(
	"title"=>"Overzicht",
	"view"=>array(
		"name"=>"users.list",
		"mode"=>"main"
	)

));


$this->addSub("users",array(
	"title"=>"Nieuw",
	"view"=>array(
		"name"=>"users.edit",
		"mode"=>"main",
		"params"=>array(
			"_id"=>""
		)
	)
));

$this->addSub("users",array(
	"title"=>"Inloggen",
	"view"=>array(
		"name"=>"users.login",
		"mode"=>"popup",
	)
));



