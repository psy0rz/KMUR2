(function( $ ){

	/*** auto create input elements from metadata
	*  Uses _key attribute to determine which meta-data to use.
	*/
	$.fn.autoCreate = function( meta , options ) {  

		var settings = {
			'class': 'autoFill'
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
								.attr("title",thismeta['desc'])
						);
					}
					else
					{
						$(this).append(
							$("<input>")
								.addClass(settings.class)
								.attr("_key",key)
								.attr("type","text")
								.attr("title",thismeta['desc'])
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
							.attr("title",thismeta['desc'])
					);
				}
				else if (thismeta['type']=='float' || thismeta['type']=='integer')
				{
					$(this).append(
						$("<input>")
							.addClass(settings.class)
							.attr("_key",key)
							.attr("type","text")
							.attr("title",thismeta['desc'])
					);
				}
				else if (thismeta['type']=='select')
				{
					//create select element
					var s=$("<select>")
						.addClass(settings.class)
						.attr("_key",key)
						.attr("type","text")
						.attr("title",thismeta['desc']);

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
							.attr("title",thismeta['desc'])
					);
				}

			}
		});

	};


	/*** Auto fills elements with specified data array
	*  Uses _key attribute to determine which data to fill.
	*  Automaticly recognises element-types and uses the correct way to 'fill in the value'.
	*  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
	*/
	$.fn.autoFill = function( data , options ) {  

		var settings = {
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}

		return this.each(function() {
			var value=data[$(this).attr("_key")];
			var elementType=this.nodeName.toLowerCase();
			
			if (elementType=="input")
			{
				if ($(this).attr("type")=="checkbox")
				{
					if (value)
						this.checked=true;
					else
						this.checked=false;
				}
				else
				{
					$(this).val(value);
				}
			}
			else if (elementType=="select" || elementType=="textarea")
			{
				$(this).val(value);
			}
			//regular html element, just set text
			else
				$(this).text(value);
		});

	};

	/*** Auto gets data from the elements and stores it in the data array
	*  Uses _key attribute as hash key
	*  Automaticly recognises element-types and uses the correct way to 'get the value'.
	*  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
	*/
	$.fn.autoGet = function( data , options ) {  

		var settings = {
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}

		return this.each(function() {
			var key=$(this).attr("_key");
			var elementType=this.nodeName.toLowerCase();
			
			if (elementType=="input")
			{
				if ($(this).attr("type")=="checkbox")
				{
					if (this.checked)
						data[key]=1;
					else
						data[key]=0
				}
				else
				{
					data[key]=$(this).val();
				}
			}
			else if (elementType=="select" || elementType=="textarea")
			{
				data[key]=$(this).val();
			}
			
			
		});

	}

})( jQuery );

