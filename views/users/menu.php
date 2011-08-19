<?

$this->addMain("users",array(
	"desc"=>"Gebruikers",
));

$this->addSub("users","list",array(
	"desc"=>"Overzicht",
	"view"=>"users.list",
));

$this->addSub("users","list2",array(
	"desc"=>"Overzicht2",
	"view"=>"users.list2",
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



$this->addMain("hours",array(
	"desc"=>"Uren registratie",
));


$this->addSub("hours","new",array(
	"desc"=>"Uren invoeren...",
	"view"=>"users.edit",
	"params"=>array(
		"_id"=>""
	),
	"mode"=>"popup",
));

$this->addSub("hours","list",array(
	"desc"=>"Overzicht",
	"view"=>"users.list",
));

$this->addSub("hours","listba",array(
	"desc"=>"Overzicht huidige klant",
	"view"=>"users.list",
));




$this->addMain("hours2",array(
	"desc"=>"Uren registratie",
));


$this->addSub("hours2","new",array(
	"desc"=>"Uren invoeren...",
	"view"=>"users.edit",
	"params"=>array(
		"_id"=>""
	),
	"mode"=>"popup",
));

$this->addSub("hours2","list",array(
	"desc"=>"Overzicht",
	"view"=>"users.list",
));

$this->addSub("hours2","listba",array(
	"desc"=>"Overzicht huidige klant",
	"view"=>"users.list",
));

