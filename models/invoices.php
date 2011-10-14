<?

require_once "model.php";

class invoices extends model
{
	function getMeta()
	{
		$users=new users();
		return (array(
			"_id"=>array(
				"type"=>"id"
			),
			"invoiceDate"=>array(
//				"readonly"=>true,
				"desc"=>"Factuur datum",
				"type"=>"date"
			),
			"number"=>array(
				"readonly"=>true,
				"desc"=>"Factuur nummer",
				"type"=>"string",
			),
			"status"=>array(
				"desc"=>"Factuur status",
				"type"=>"select",
				"default"=>"new",
				"choices"=>array(
					"new"=>"Nieuw (wijzigbaar)",
					"send"=>"Gefactueerd en verstuurd",
					"remind1"=>"1e herinnering verstuurd",
					"remind2"=>"2e herinnering verstuurd",
					"payed"=>"Betaald"
				)
			),
			"statusDate"=>array(
//				"readonly"=>true,
				"desc"=>"Laatste status wijziging",
				"type"=>"date"
			),
			"printedOwnCopy"=>array(
				"desc"=>"Eigen copy geprint voor in boekhouding",
				"type"=>"bool",
			),
			"desc"=>array(
				"desc"=>"Factuur notities",
				"type"=>"string",
			),
			"userId"=>array(
				"desc"=>"Klant",
				"type"=>"select",
				"choices"=>$users->getNames(array("right"=>"customer"))
			),
			"user"=>array(
				"desc"=>"Copy klant gegevens",
				"type"=>"hash",
				"readonly"=>true,
				"meta"=>$users->getMeta(),
			),
			"items"=>array(
				"desc"=>"Factuur data",
				"type"=>"array",
				"meta"=>array(
					"index"=>array(
						"type"=>"integer"
					),
					"amount"=>array(
						"desc"=>"Aantal",
						"type"=>"integer"
					),
					"desc"=>array(
						"desc"=>"Product omschrijving",
						"type"=>"string",
					),
					"price"=>array(
						"desc"=>"Prijs",
						"type"=>"float",
					),
				)
			),
			"tax"=>array(
				"desc"=>"Belasting percentage",
				"type"=>"float",
				"default"=>"19",
			),
			"total"=>array(
				"readonly"=>true,
				"desc"=>"Totaal prijs (incl btw)",
				"type"=>"float",
			),
			"log"=>array(
				"desc"=>"Logboek",
				"type"=>"array",
				"readonly"=>true,
				"meta"=>array(
					"date"=>array(
						"desc"=>"Datum",
						"type"=>"date"
					),
					"text"=>array(
						"desc"=>"Log text",
						"type"=>"string",
					),
					"user"=>array(
						"desc"=>"User",
						"type"=>"string",
					)
				)
			)
		));
	}

	
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),

		));
	}


	function getAll()
	{
		$collection = $this->db->invoices;

		// find everything in the collection
		$cursor=$collection->find();

		return ($this->run($cursor));
	}

	function get($params)
	{
		//TEST 
		return (array(
			"_id"=>"sdfdsaffsffsf",
			"invoiceDate"=>13213323,
			"number"=>"2011-0031",
			"statusDate"=>1318494259,
			"printedOwnCopy"=>0,
			"desc"=>"blablab bla factuurrrrnotities",
			"userId"=>"fsfsdfdsfsfs",
			"user"=>"sf (MOET NOG)",
			"items"=>array(
				array(
					"amount"=>1,
					"desc"=>"1e item",
					"price"=>123,
				),
				array(
					"amount"=>2,
					"desc"=>"2e item",
					"price"=>2222,
				),
				array(
					"amount"=>3,
					"desc"=>"3e item",
					"price"=>333,
				),
				array(
					"amount"=>3,
					"desc"=>"3e item",
					"price"=>333,
				),
			),
			"tax"=>19,
			"total"=>1234,
			"log"=>array(
				array(
					"date"=>12313123,
					"text"=>"log regel 1",
					"user"=>"geert"
					),
				array(
					"date"=>12313523,
					"text"=>"log regel 2",
					"user"=>"geert"
					),
				array(
					"date"=>12313843,
					"text"=>"log regel 3",
					"user"=>"psy"
					),
					
			)
		));
	
		if (isset($params['_id']) && $params['_id'])
			$invoice=$this->getById("invoices", $params['_id']);
		else
			$invoice=null;
	
		return ($invoice);
	}

	//update/add project
	function put($params)
	{
		$this->verifyMeta($params);
	
		//project exists?
//		$existing=$this->db->projects->findOne(array('projectname'=>$params['projectname']));
		
//		if ($existing && $existing["_id"]!=$params["_id"])
//			throw new FieldException("Project bestaat al!", "projectname");

		$this->setById("invoices", $params["_id"], $params);
	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("invoices", $params["_id"]);

	}


}


