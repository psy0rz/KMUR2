(function( $ ){

/*** auto create input elements from metadata
 *  Uses _key attribute to determine which meta-data to use.
 */
$.fn.autoCreate = function( meta , options ) {  

	var settings = {
		'class': 'autoInput'
	};
	
	if ( options ) { 
		$.extend( settings, options );
	}

    return this.each(function() {        
		var key=$(this).attr("_key");
		var thismeta=meta[key];
		
		if (thismeta!=null)
		{
			if (thismeta['type']=='string')
			{
				if (thismeta['max']==null || thismeta['max']>100)
				{
					$(this).html(
						$("<textarea>")
							.addClass(settings.class)
							.attr("_key",key)
					);
				}
				else
				{
					$(this).append(
						$("<input>")
							.addClass(settings.class)
							.attr("_key",key)
							.attr("type","text")
					);
				}
			}
			else if (thismeta['type']=='password')
			{
				$(this).append(
					$("<input>")
						.addClass(settings.class)
						.attr("_key",key)
						.attr("type","password")
				);
			}
			else if (thismeta['type']=='float' || thismeta['type']=='integer')
			{
				$(this).append(
					$("<input>")
						.addClass(settings.class)
						.attr("_key",key)
						.attr("type","text")
				);
			}
			else if (thismeta['type']=='select')
			{
				//create select element
				var s=$("<select>")
					.addClass(settings.class)
					.attr("_key",key)
					.attr("type","text");

				//add choices
				$.each(thismeta['choices'], function(choice, desc){
					s.append(
						$("<option>")
							.attr("value",choice)
							.text(desc)
					);
				});

				//add results to div
				$(this).append(s);
			}
			else if (thismeta['type']=='bool')
			{
				$(this).append(
					$("<input>")
						.addClass(settings.class)
						.attr("_key",key)
						.attr("type","checkbox")
				);
			}

		}
	});

};


/*** Autofills elements with specified data array
 *  Uses _key attribute to determine which data to fill.
 *  Automaticly recognises element-types and uses the correct way to 'fill in the value'.
 *  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
 */
$.fn.autoFill = function( meta , options ) {  

	var settings = {
	};
	
	if ( options ) { 
		$.extend( settings, options );
	}

    return this.each(function() {        

		
		
	});

};



})( jQuery );

