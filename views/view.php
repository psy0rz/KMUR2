<?
/** Common functions that are only used inside views

  Try not to include other php files in here.
*/

/** Get the JSON parameters that are specified in the query string and santize them
 *
 * Use this to get the parameters that where specified while loading the current view.
 */
function viewGet()
{
	//the decode/encode cycle is neccesary to prevent script injection attacks!
	return(json_encode(json_decode(urldecode(
		preg_replace("/&.*/", "", $_SERVER['QUERY_STRING'])
	))));
}
