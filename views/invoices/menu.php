<?

$this->addMain("invoices",array(
	"title"=>"Facturatie",
));

$this->addSub("invoices",array(
	"title"=>"Overzicht",
	"view"=>array(
		"name"=>"invoices.list",
		"mode"=>"main"
	)
));

$this->addSub("invoices",array(
	"title"=>"Nieuw",
	"view"=>array(
		"name"=>"invoices.edit",
		"mode"=>"main",
		"params"=>array(
			"_id"=>""
		)
	)
));

