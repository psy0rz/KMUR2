<?

$this->addMain("test",array(
	"title"=>"Test",
));

$this->addSub("test",array(
	"title"=>"Overzicht",
	"view"=>array(
		"name"=>"test.list",
		"mode"=>"main"
	)

));

$this->addSub("test",array(
		"title"=>"Nieuw",
		"view"=>array(
				"name"=>"test.edit",
				"mode"=>"main",
				"params"=>array
				(
					"_id"=>""		
				)
		)

));

