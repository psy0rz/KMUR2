<?

$this->addMain("invoices",array(
	"desc"=>"Facturatie",
));

$this->addSub("invoices","list",array(
	"desc"=>"Overzicht",
	"view"=>array(
		"name"=>"invoices.list",
		"mode"=>"popup"
	)
));

$this->addSub("invoices","new",array(
	"desc"=>"Nieuw",
	"view"=>array(
		"name"=>"invoices.edit",
		"mode"=>"main",
		"viewParams"=>array(
			"_id"=>""
		)
	)
));

