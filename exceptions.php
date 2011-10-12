<?
//throw this if there's something wrong with a field
class FieldException extends Exception
{
	private $fields;

	// Redefine the exception so message isn't optional
    public function __construct($message, $field) {
        $this->fields=array();
        
        if ($field)
			$this->fields[]=$field;
		
        // make sure everything is assigned properly
        parent::__construct($message);
    }
    
    public function addField($field)
    {
		$this->fields[]=$field;
    }
    
    public function insertField($field)
	{
		array_unshift($this->fields, $field);
	}
    
    public function getFields()
    {
		return ($this->fields);
    }
    
}
 
