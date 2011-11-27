<?

require_once "model.php";

class invoices extends model
{
	//invoice metadata depens on the current state of the invoice.
	function getMeta($params='')
	{
		$users=new users();
		
		$readonly=false;
		if (isset($params['_id']) && $params['_id'])
		{
			$invoice=$this->getById("invoices", $params["_id"], $params);
			if ($invoice["status"]!="new")
				$readonly=true;
		}

		return (array(
			"_id"=>array(
				"type"=>"id"
			),
			"invoiceDate"=>array(
				"readonly"=>$readonly,
				"desc"=>"Factuur datum",
				"type"=>"date"
			),
			"number"=>array(
				"readonly"=>$readonly,
				"max"=>20,
				"desc"=>"Factuur nummer",
				"type"=>"integer",
			),
			"status"=>array(
				"desc"=>"Factuur status",
				"type"=>"select",
				"readonly"=>$readonly,
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
				"readonly"=>true,
				"desc"=>"Laatste status wijziging",
				"type"=>"date"
			),
			"printedOwnCopy"=>array(
				"desc"=>"Eigen copy geprint voor in boekhouding",
				"type"=>"bool",
			),
			"desc"=>array(
				"readonly"=>$readonly,
				"desc"=>"Factuur notities",
				"type"=>"string",
			),
			"userId"=>array(
				"readonly"=>$readonly,
				"desc"=>"Klant",
				"type"=>"select",
				"choices"=>$users->getNames(array("right"=>"customer"))
			),
			"user"=>array(
				"desc"=>"Copy klant gegevens",
				"type"=>"hash",
				"readonly"=>$readonly,
				"meta"=>$users->getMeta(),
			),
			"items"=>array(
				"desc"=>"Factuur data",
				"type"=>"array",
				"readonly"=>$readonly,
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
				"readonly"=>$readonly,
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
		if (isset($params['_id']) && $params['_id'])
			$invoice=$this->getById("invoices", $params['_id']);
		else
			$invoice=null;
			
	
		return ($invoice);
	}

	//update/add invoice
	function put($params)
	{
			debug(time());
//		$this->verifyMeta($params, $this->getMeta($params));
	
		//project exists?
//		$existing=$this->db->projects->findOne(array('projectname'=>$params['projectname']));
		
//		if ($existing && $existing["_id"]!=$params["_id"])
//			throw new FieldException("Project bestaat al!", "projectname");
		//new invoice?
		if (!$params["_id"])
		{
			//determine new number
			$cursor=$this->db->invoices->find();
			$cursor->sort(array(
				'number' => -1
			))->limit(1);
			$lastInvoice=$cursor->getNext();
			$params["number"]=($lastInvoice["number"]+1);
		}

		$this->setById("invoices", $params["_id"], $params, $this->getMeta($params));
	}

	function del($params)
	{
		$this->verifyMeta($params);
		$this->delById("invoices", $params["_id"]);

	}


}


