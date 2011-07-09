<?
//throw this if there's something wrong with a field
class FieldException extends Exception
{
	public $field;
	public $id;
	
    // Redefine the exception so message isn't optional
    public function __construct($message, $field, $id='') {
        $this->field=$field;
		$this->id=$id;
		
        // make sure everything is assigned properly
        parent::__construct($message);
    }
}
 
