<?

$this->addMain("invoices",array(
	"desc"=>"Facturatie",
));

$this->addSub("invoices","list",array(
	"desc"=>"Overzicht",
	"view"=>"invoices.list",
));

$this->addSub("invoices","new",array(
	"desc"=>"Nieuw",
	"view"=>"invoices.edit",
	"params"=>array(
		"_id"=>""
	)
));

