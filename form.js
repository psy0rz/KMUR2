

(function( $ ){

	/*** popup a confim dialog at cursor and execute code on each pressed button
	*/
	$.fn.confirm = function( options ) {  
		
		var settings = {
			'title'		: 'Bevestiging',
			'text' 		: 'Weet u het zeker?'
		};
		
		if ( typeof options == 'function' ) 
		{
			settings['callback']=options;
		}
		else
		{
			$.extend( settings, options );
		}
		
		var div=$("<div>");
		div.text(settings.text);
		div.append('<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>');
		
		var parent=$(this);

		parent.addClass("ui-state-highlight");
		parent.append(div);
		
		div.dialog({
			
//			position: [ 
//				event.clientX,
//				event.clientY 
//			],
			'modal':true,
			'title':settings.title,
			'buttons': {
				"Ja": function() {
					settings['callback']();
					$( this ).dialog( "close" );
				},
				"Nee": function() {
					$( this ).dialog( "close" );
				}
			},
			'close'	: function(){
				parent.removeClass("ui-state-highlight");
				div.remove();
			}
		});
		
	};

	/*** popup a error dialog at cursor 
	*/
	$.fn.error = function( options ) {  
		
		var settings = {
			'title'		: 'Fout',
			'text' 		: 'Onbekende fout opgetreden'
		};
		
		if ( typeof options == 'function' ) 
		{
			settings['callback']=options;
		}
		else
		{
			$.extend( settings, options );
		}
		
		var div=$("<div>");
		div.text(settings.text);
		div.append('<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>');
		
		var parent=$(this);

		parent.append(div);
		
		div.dialog({
			
//			position: [ 
//				event.clientX,
//				event.clientY 
//			],
			'modal':true,
			'title':settings.title,
			'buttons': {
				"Ok": function() {
					$( this ).dialog( "close" );
				}
			},
			'close'	: function(){
				if (settings.callback)
				{
					settings.callback();
				}
				div.remove();
			}
		});
		
	};

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
				else if (thismeta.type=='string')
				{
					if (thismeta['max']==null || thismeta['max']>100)
					{
						$(this).html(
							$("<textarea>")
								.addClass(settings.class)
								.attr("_key",key)
								.attr("title",thismeta.desc)
						);
					}
					else
					{
						$(this).append(
							$("<input>")
								.addClass(settings.class)
								.attr("_key",key)
								.attr("type","text")
								.attr("title",thismeta.desc)
						);
					}
					$(this).val(thismeta.default);
				}
				else if (thismeta.type=='password')
				{
					$(this).append(
						$("<input>")
							.addClass(settings.class)
							.attr("_key",key)
							.attr("type","password")
							.attr("title",thismeta['desc'])
					);
					$(this).val(thismeta.default);
				}
				else if (thismeta.type=='float' || thismeta.type=='integer')
				{
					$(this).append(
						$("<input>")
							.addClass(settings.class)
							.attr("_key",key)
							.attr("type","text")
							.attr("title",thismeta['desc'])
					);
					$(this).val(thismeta.default);
				}
				else if (thismeta.type=='select')
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

					s.val(thismeta.default);

					//add results to div
					$(this).append(s);
				}
				else if (thismeta.type=='multiselect')
				{
					var parent=$(this);
					//add choices
					$.each(thismeta['choices'], function(choice, desc){
						//add checkbox
						var checkbox=$("<input>")
								.addClass(settings.class)
								.attr("value",choice)
								.attr("type","checkbox")
								.attr("_key",key)
								.attr("id",key+"."+choice)
								.attr("title",thismeta['desc'])

						checkbox.checked=(thismeta.default.indexOf(choice) != -1);
						parent.append(checkbox);
						
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
				else if (thismeta.type=='bool')
				{
					var checkbox=$("<input>")
						.addClass(settings.class)
						.attr("_key",key)
						.attr("type","checkbox")
						.attr("value","")
						.attr("title",thismeta['desc']);

					checkbox.checked=thismeta.default;
					$(this).append(checkbox);
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
	$.fn.autoFill = function( meta , data,  options ) {  

		var settings = {
			'showChanges':false
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}

		return this.each(function() {
			var key=$(this).attr("_key");
			var value=data[key];
			var metaValue=meta[key];
			var elementType=this.nodeName.toLowerCase();
			var changed=false;

			//put value in attribute (doesnt work if the value is an array)
			if (typeof $(this).attr("_value") !='undefined')
			{
				$(this).attr("_value", value);
			}
			//set value of a input-element the correct way
			else if (elementType=="input")
			{
				if ($(this).attr("type")=="checkbox")
				{
					var newChecked;
					
					//value checkbox. check if the array contains this checkbox's value
					if ($(this).attr("value"))
					{
						if (typeof(value)=='object' && value.indexOf($(this).attr("value")) != -1)
							newChecked=true;
						else
							newChecked=false;
					}
					//simple boolean 0/1 checkbox:
					else
					{
						if (value)
							newChecked=true;
						else
							newChecked=false;
					}
					
					changed=(this.checked!=newChecked);
					this.checked=newChecked;
				}
				else
				{
					changed=($(this).val()!=value);
					$(this).val(value);
				}
			}
			//textareas and select boxes are easy:
			else if (elementType=="select" || elementType=="textarea")
			{
				changed=($(this).val()!=value);
				$(this).val(value);
			}
			//it regular html element, convert the value to a string and/or html
			//depending on the datatype
			else
			{
				if (metaValue.type=="bool")
				{
					var newElement=$("<span>");
					
					if (value)
					{
						newElement.addClass("autoHtml_"+metaValue.type+"_True");
						newElement.addClass("autoHtml_"+key+"_True");
						newElement.text("Ja");
					}
					else
					{
						newElement.addClass("autoHtml_"+metaValue.type+"_False");
						newElement.addClass("autoHtml_"+key+"_False");
						newElement.text("Nee");
					}
					changed=($(this).text()!=$(newElement).text());
					$(this).empty();
					$(this).append(newElement);
				}
				else if (metaValue.type=="select")
				{
					var newElement=$("<span>");
					newElement.addClass("autoHtml_"+metaValue.type+"_"+value);
					newElement.addClass("autoHtml_"+key+"_"+value);
					newElement.text(metaValue.choices[value]);
				
					changed=($(this).text()!=newElement.text());
					$(this).empty();
					$(this).append(newElement);
				}
				else if (metaValue.type=="multiselect")
				{
					var oldText=$(this).text();
					$(this).empty();
					var first=true;
					var element=$(this);
					for(valueI in value)
					{
						element.append(
							$("<span>")
								.addClass("autoHtml_"+metaValue.type)
								.addClass("autoHtml_"+metaValue.type+"_"+value[valueI])
								.addClass("autoHtml_"+key+"_"+value[valueI])
								.text(metaValue.choices[value[valueI]])
						);
					}
					changed=($(this).text()!=oldText);
				}
				else
				{
					changed=($(this).text()!=value);
					$(this).text(value);
				}
			}

			//something changed and we need to highlight it?
			if (changed && settings.showChanges)
			{
				$(this).effect('highlight', 2000);
			}

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
	 * Use updateOn to update an existing list (update, delete and add items)
	 * Specify the data-key that should be stored in _value to be able to update
	 */
	$.fn.autoList = function( meta, data , options ) {

		var settings = {
			'class': 'autoFill',
			'updateOn': false
		};
		
		if ( options ) {
			$.extend( settings, options );
		}


		//traverse all the specified lists
		var ret=this.each(function() {

			var sourceElement=this;
			var parentElement=$(this).parent();
			
			$(sourceElement).show();
			
			//traverse the input data
			$.each(data, function(key, value) {
				var updateElement={};
				
				//update mode?
				if (settings.updateOn)
				{
					//try to find existing element
					updateElement=$(".autoListClone[_value="+value[settings.updateOn]+"]", $(sourceElement).parent());
				}

				//not found, add new element?
				if (!updateElement.length)
				{
					updateElement=$(sourceElement).clone();
					updateElement.removeClass("autoList");
					updateElement.addClass("autoListClone");
					updateElement.appendTo(parentElement);
				}

				//now autofill the element and its sibblings
				var autoFillSettings={};
				autoFillSettings.showChanges=(settings.updateOn!="");
				$(updateElement).filter("."+settings.class).autoFill(meta, value, autoFillSettings);
				$("."+settings.class, updateElement).autoFill(meta, value, autoFillSettings);

			});

			$(sourceElement).hide();
			
			//do we need to delete items?
			if (settings.updateOn)
			{
				//build a map of currenly existing id's
				var idMap={};
				$.each(data, function(key, value) {
					idMap[value[settings.updateOn]]=1;
				});
				
				//traverse all the html list items
				$(".autoListClone", parentElement).each(function() {
					//does not exist anymore?
					if (!idMap[$(this).attr("_value")])
					{
						$(this).hide(1000,function()
						{
							$(this).remove();
						});
					}
				});
				
			}
			
			
		});
		
		return(ret);
	}

})( jQuery );

