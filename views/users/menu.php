<?

$this->addMain("users",array(
	"desc"=>"Gebruikers",
));

$this->addSub("users","list",array(
	"desc"=>"Overzicht",
	"path"=>"/users/list",
));

$this->addSub("users","new",array(
	"desc"=>"Nieuw",
	"path"=>"/users/new",
));

