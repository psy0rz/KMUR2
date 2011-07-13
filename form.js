/*** Shows error and highlights field
	*/
function showError(result)
{
	$("#error").text("");
	$(".errorHighlight").removeClass("errorHighlight");

	if (result!=null)
	{
		if (result["error"]!=null)
		{
			$("#error").text(result["error"]["message"]);
			if (result["error"]["field"]!=null)
			{
				$(':input[_key|="'+result["error"]["field"]+'"]').addClass("errorHighlight").focus();
				$('[_errorHighlight|="'+result["error"]["field"]+'"]').addClass("errorHighlight");
			}
		}
	}
}


(function( $ ){
	
	/*** auto create input elements from metadata
	*  Use _key attribute to specify meta-field.
	*  If _meta is specified, that meta-field will be litterly filled in as text.
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
			
			$(this).empty();
			if (thismeta!=null)
			{
				if ($(this).attr("_meta"))
				{
					$(this).text(thismeta[$(this).attr("_meta")]);
				}
				else if (thismeta['type']=='string')
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
				else if (thismeta['type']=='multiselect')
				{
					var parent=$(this);
					//add choices
					$.each(thismeta['choices'], function(choice, desc){
						//add checkbox
						parent.append(
							$("<input>")
								.addClass(settings.class)
								.attr("value",choice)
								.attr("type","checkbox")
								.attr("_key",key)
								.attr("id",key+"."+choice)
								.attr("title",thismeta['desc'])
						);
						
						//add description
						parent.append(
							$("<label>")
								.attr("for",key+"."+choice)
								.attr("_errorHighlight",key)
								.text(desc)
						);
						
						//add break
						parent.append($("<br>"));

					});
				}
				else if (thismeta['type']=='bool')
				{
					$(this).append(
						$("<input>")
							.addClass(settings.class)
							.attr("_key",key)
							.attr("type","checkbox")
							.attr("value","")
							.attr("title",thismeta['desc'])
					);
				}

			}
		});

	};


	/*** Auto fills elements with specified data array
	*  Uses _key attribute to determine which data to fill.
	*  Specify _value to store the value in this attribute instead of the element itself.
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

			if ($(this).attr("_value")=="")
			{
				$(this).attr("_value", value);
			}
			else if (elementType=="input")
			{
				if ($(this).attr("type")=="checkbox")
				{
					//value checkbox. check if the array contains this checkbox's value
					if ($(this).attr("value"))
					{
						if (typeof(value)=='object' && value.indexOf($(this).attr("value")) != -1)
							this.checked=true;
						else
							this.checked=false;
					}
					//simple boolean 0/1 checkbox:
					else
					{
						if (value)
							this.checked=true;
						else
							this.checked=false;
					}
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
					//value checkbox. add all the selected values to an array
					if ($(this).attr("value"))
					{
						if (data[key]==null)
							data[key]=new Array();
						
						if (this.checked)
							data[key].push($(this).attr("value"));
					}
					//simple boolean 0/1 checkbox:
					else
					{
						if (this.checked)
							data[key]=1;
						else
							data[key]=0;
					}
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

	/*** Replicates the specified element for every item in the data-array
	 * Calls autoFill everytime, for elements of class autoFill
	 */
	$.fn.autoList = function( data , options ) {  

		var settings = {
			'class': 'autoFill',
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}

		return this.each(function() {
			var sourceElement=this;
			var parentElement=$(this).parent();
			$.each(data, function(key, value) {
				$(sourceElement)
					.clone()
					.appendTo(parentElement)
					.find("."+settings.class)
					.autoFill(value);
				
			});
		});
	}

})( jQuery );

