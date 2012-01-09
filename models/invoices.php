<?


class invoices extends model_Mongo
{
	//meta data that is also stored in the user-model (mostly invoice address data and tax)
	function getUserMeta()
	{
		return(array(
			/// Common and invoiceSpecific stuff (used by invoices model)
			"company"=>array(
				"desc"=>"Bedrijfsnaam",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"tax"=>array(
				"desc"=>"BTW",
				"type"=>"select",
				"default"=>"0.19",
				"choices"=>array(
					"0.19"=>"19 %",
					"0.6"=>"6 %",
					"0"=>"0 %",
				)
			),
			"invoiceName"=>array(
				"desc"=>"Ter attentie van",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceAddress"=>array(
				"desc"=>"Adres",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCity"=>array(
				"desc"=>"Woonplaats",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePostalcode"=>array(
				"desc"=>"Postcode",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCountry"=>array(
				"desc"=>"Land",
				"type"=>"select",
				"default"=>"nl",
				"choices"=>array(
					"nl"=>"Nederland",
					"be"=>"Belgie",
					"de"=>"Duitsland",
				)
			),
			"invoiceEmail"=>array(
				"desc"=>"Email address",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePhone"=>array(
				"desc"=>"Telefoonnummer",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
		));
	}

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

		$meta=(array(
			"_id"=>array(
				"type"=>"mongoId"
			),
			"invoiceDate"=>array(
				"readonly"=>$readonly,
				"desc"=>"Factuur datum",
				"type"=>"date"
			),
			"number"=>array(
				"readonly"=>$readonly,
				"max"=>9,
				"min"=>9,
				"desc"=>"Factuur nummer",
				"type"=>"string",
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
				"desc"=>"BTW",
				"type"=>"select",
				"default"=>"0.19",
				"choices"=>array(
					"0.19"=>"19 %",
					"0.6"=>"6 %",
					"0"=>"0 %",
				)
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
			),
			/// Invoice contact info
			"invoiceName"=>array(
				"desc"=>"Ter attentie van",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceAddress"=>array(
				"desc"=>"Adres",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCity"=>array(
				"desc"=>"Woonplaats",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePostalcode"=>array(
				"desc"=>"Postcode",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoiceCountry"=>array(
				"desc"=>"Land",
				"type"=>"select",
				"default"=>"nl",
				"choices"=>array(
					"nl"=>"Nederland",
					"be"=>"Belgie",
					"de"=>"Duitsland",
				)
			),
			"invoiceEmail"=>array(
				"desc"=>"Email address",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),
			"invoicePhone"=>array(
				"desc"=>"Telefoonnummer",
				"type"=>"string",
				"min"=>0,
				"max"=>50
			),

		));

		//add invoice stuff that is also used in user-model:
		foreach ($this->getUserMeta() as $key=>$userMeta)
		{
			$meta[$key]=$userMeta;
			$meta[$key]["readonly"]=$readonly;
		}


		return ($meta);
	}

	
	function getAcl()
	{
		return(array(
			"default"=>array("admin"),

		));
	}


	function getAll($params)
	{
		$collection = $this->db->invoices;

		//filtering
		$filter=array();
		if (isset($params['filter']))
		{
			foreach($params['filter'] as $key=>$value)
			{
				if (isset($params['filter'][$key]))
					$filter[$key]=new MongoRegex("/$value/i");			
			}
		}

		// find everything in the collection
		$cursor=$collection->find($filter);

		if (isset($params['sort']))
			$cursor->sort($params['sort']);

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
		$this->verifyMeta($params, $this->getMeta($params));
	
		//project exists?
//		$existing=$this->db->projects->findOne(array('projectname'=>$params['projectname']));

//		if ($existing && $existing["_id"]!=$params["_id"])
//			throw new FieldException("Project bestaat al!", "projectname");
		//new invoice?
		if (!$params["_id"])
		{
			//determine current invoice number:
			$cursor=$this->db->invoices->find();
			$cursor->sort(array(
				'number' => -1
			))->limit(1);
			$lastInvoice=$cursor->getNext();

			//parse year and count
			$year="";
			$fields=explode("-",$lastInvoice["number"]);
		
			if (count($fields)==2)
			{	
				$year=$fields[0];
				$count=$fields[1];
			}
	
			//year changed?
			if ($year != date("Y"))
			{
				$year=date("Y");
				$count=1;
			}
			//same year, just increase counter
			else
				$count++;

			//set new number:
			$params["number"]=("$year-".sprintf("%04s",$count));

		}

		//store it 
		$id=$this->setById("invoices", $params["_id"], $params, $this->getMeta($params));

		//do logging
		$data=$this->getById("invoices",$id);
		if ($params["_id"])
			logger("info", "Factuur ".$data["number"]." gewijzigd.");
		else
			logger("info", "Factuur ".$data["number"]." toegevoegd.");
			
		

	}

	//cant delete invoice once its created to keep bookkeeping consistent!
//	function del($params)
//	{
//		$this->verifyMeta($params);
//		$this->delById("invoices", $params["_id"]);
//
//	}


}


