

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
					settings['callback'].call(parent);
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

	function stripKey(strip, key)
	{
		//need to strip something?
		if (strip)
		{
			//it doesnt match, so we cant strip it!
			if (key.substr(0,strip.length+1)!=strip+".")
				return "";
			
			return(key.substr(strip.length+1));
		}
		return (key);		
	}
	
	//returns a reference in the meta-object, by traversing the key
	//example key: items.price
	//returns null when key can not be found.
	function resolveMeta(key, meta)
	{
		if (!key)
			return(null);
		
		var keyList=key.split(".");
		var thismeta=meta[keyList[0]];
		for (keyI=1; keyI<keyList.length; keyI++)
		{	
			if (("meta" in thismeta) && (keyList[keyI] in thismeta["meta"]))
			{
				thismeta=thismeta["meta"][keyList[keyI]];
			}
			else
			{
				//key not found in meta
				thismeta=null;
				break;
			}
		}
		return (thismeta);
	}
	
	//returns a reference in the dataobject, by traversing the key.
	//example key: items.price
	//note: creates Objects() in data for keys that do not yet exist. (e.g. builds a hasharray for you)
	function resolveData(key, data)
	{
		if (!key)
			return(null);

		var keyList=key.split(".");
		var thisdata=data;
		for (keyI=0; keyI<keyList.length; keyI++)
		{	
			if (keyList[keyI] in thisdata)
			{
				thisdata=thisdata[keyList[keyI]];
			}
			else
			{
				//key not found in meta, create it:
				if (typeof(thismeta)!='object')
				{
					console.error("resolveData warning: changing data to object:",key,data);
					thisdata=new Object();
				}
				thisdata[keyList[keyI]]=null;
				thisdata=thisdata[keyList[keyI]];
			}
		}
		return (thisdata);
	}
	
	/*** 
	*/
	$.fn.autoMeta = function( meta , parentKey ) {  

		
		if (!meta)
			return;

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//traverse the specified meta data
			$.each(meta, function(key, thismeta){
				var keyStr;
				if (parentKey)
					keyStr=parentKey+"."+key;
				else
					keyStr=key;
				
				var selector='.autoMeta[_key="'+keyStr+'"]';
							
				//traverse the autoMeta elements that reference this key
				$(selector, context).each(function()
				{
					
					//just fill in the value of the specified metadata-field as plain text?
					if ($(this).attr("_meta"))
						$(this).text(thismeta[$(this).attr("_meta")]);
					//convert metadata to input element:
					else
					{
						var addedElement=dataConv[thismeta.type].input(this, thismeta, keyStr);
						if (addedElement)
						{
							addedElement.addClass("autoPut")
								.attr("_key",keyStr)
								.attr("title",thismeta.desc);
							
							if (!thismeta.readonly)
							{
								addedElement.addClass("autoGet")
							}
							else
							{
								addedElement.attr('disabled',true);
							}
							//now add the new element to the DOM:
							$(this).empty();
							$(this).append(addedElement);
						}
						
					}
				}); //key
			}); //meta
		}); //elements
		
	};

	/*** Auto fills elements with specified data array
	*  Uses _key attribute to determine which data to fill.
	*  XXX Specify _value to store the value in this attribute instead of the element itself.
	*  Automaticly recognises element-types and uses the correct way to 'fill in the value'.
	*  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
	*  Some meta-types like dates and times are treated specially with datepickers. (conversion from and to timestamps is done by the datpicker )
	*/
	$.fn.autoPutOud = function( meta , data,  keyStr ) {  

		var settings = {
			showChanges:false,
			autoPutClass:'autoPut',
//			autoPutedClass:'autoPuted',
			autoListSourceClass:'autoListSource'
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}


//		//we need to remember which nodes we processed (because of recursion)
//		if (!settings.recursed)
//		{
//			//remove old autoPut-reminders
//			$("."+settings.autoPutedClass, settings.context).removeClass(settings.autoPutedClass);
//			settings.recursed=true;
//		}
		
		logDebug("autoPut called with ",meta,data,options);

		return this.each(function() {

//			//check if we didnt process it yet.
//			//(its possible we already processed it, because of recursion for type array)
//			if (!$(this).hasClass(settings.autoPutedClass))
//			{
			
				var key=$(this).attr("_key");
				var strippedKey=stripKey(settings.parentKey, key);
				
				var thismeta=resolveMeta(strippedKey, meta);
				var value=resolveData(strippedKey, data);
				
				var elementType=this.nodeName.toLowerCase();
				var changed=false;

				logDebug("autoPuting ", this, " with ", key, thismeta,value);

				
				//make sure we process it only once.
				$(this).addClass(settings.autoPutedClass);

				//no or nonexisting key?, do nothing
				if (value==null || thismeta==null)
				{
					//its normal that a key does not exist in data, but it always should exist in metadata
					if (thismeta==null)
					{
						if (!key)
							console.error("autoPut: _key not specified in ",this);
						else if (!thismeta)
							console.error("autoPut: _key not found in metadata: ",key ,meta, data);

						var addedElement=$("<span>")
							.addClass("autoProgramError")
							.text("unknown _key:"+key);
						$(this).append(addedElement);
					}
				}
				
//				//recurse into hash?
				else if (thismeta.type=="hash")
				{
					; //do nothing?
//					logDebug("autoPut recursing into hash: ",key);
//					$("."+settings.autoPutClass, this).autoPut(thismeta.meta, value, settings);
				}
				
				//recurse into array?
				else if (thismeta.type=="array")
				{
					var subSettings={};
					$.extend( subSettings, settings );
					subSettings.parentKey=key;

					logDebug("autoPut recursing into array with autoList:", key);
					$(this).autoList(thismeta.meta, value, subSettings);
				}
				
//				//put value in attribute 
//				else if (typeof $(this).attr("_value") !='undefined')
//				{
//					$(this).attr("_value", value);
//				}

				//set value of a input-element the correct way
				else if (elementType=="input")
				{
					//date (use datepicker)
					if (thismeta.type=="date")
					{
						$(this).datepicker("setDate", new Date(value*1000));
					}
					else if ($(this).attr("type")=="checkbox")
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
						
						changed=($(this).attr("checked")!=newChecked);
						$(this).attr("checked",newChecked);
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
					if (thismeta.type=="bool")
					{
						var newElement=$("<span>");
						
						if (value)
						{
							newElement.addClass("autoHtml_"+thismeta.type+"_True");
							newElement.addClass("autoHtml_"+key+"_True");
							newElement.text("Ja");
						}
						else
						{
							newElement.addClass("autoHtml_"+thismeta.type+"_False");
							newElement.addClass("autoHtml_"+key+"_False");
							newElement.text("Nee");
						}
						changed=($(this).text()!=$(newElement).text());
						$(this).empty();
						$(this).append(newElement);
					}
					else if (thismeta.type=="select")
					{
						var newElement=$("<span>");
						newElement.addClass("autoHtml_"+thismeta.type+"_"+value);
						newElement.addClass("autoHtml_"+key+"_"+value);
						newElement.text(thismeta.choices[value]);
					
						changed=($(this).text()!=newElement.text());
						$(this).empty();
						$(this).append(newElement);
					}
					else if (thismeta.type=="multiselect")
					{
						var oldText=$(this).text();
						$(this).empty();
						var first=true;
						var element=$(this);
						for(valueI in value)
						{
							element.append(
								$("<span>")
									.addClass("autoHtml_"+thismeta.type)
									.addClass("autoHtml_"+thismeta.type+"_"+value[valueI])
									.addClass("autoHtml_"+key+"_"+value[valueI])
									.text(thismeta.choices[value[valueI]])
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
//			}
//			else
//			{
//				logDebug("skipped auto filling ", this, " with ",meta,data,settings);
//			}
		});

	};

	
	/*** Replicates the specified element for every item in the data-array
	 * Calls autoPut everytime, for elements of class autoPut
	 * Use update:true to update an existing list with new data.
	 * Set indexkey to specify with key to use as listitem index. (usually some kinds of id)
	 * Use showChanges:true to show changes in update-mode.
	 * 
	 * The source item should have the autoListSourceClass
	 * All the listitems get the autoListClass. (even the source item)
	 */
	$.fn.autoListOud = function( meta, data , options ) {

		var settings = {
			autoGetClass: 'autoGet',
			autoPutClass: 'autoPut',
//			autoPutedClass: 'autoPuted',
			autoListClass: 'autoListItem',
			autoListSourceClass: 'autoListSource',
			showChanges: false,
			indexKey: '',
			update:false
		};
		
		if ( options ) {
			$.extend( settings, options );
		}


//		//we need to remember which nodes we processed (because of recursion)
//		if (!settings.recursed)
//		{
//			//remove autoPuted-reminders
//			$("."+settings.autoPutedClass, settings.context).removeClass(settings.autoPutedClass);
//			settings.recursed=true;
//		}


		//traverse all the specified list sources
		var ret=this.each(function() {

//			//check if we didnt already process it because of recursion
//			if (!$(this).hasClass(settings.autoPutedClass))
//			{
				logDebug("auto listing ", this, " with ",meta,data,settings);

				var sourceElement=this;
				var parentElement=$(this).parent();


///				$(sourceElement).show();
//				settings.showChanges=(settings.updateOn!="");
				
				//traverse the input list
				$.each(data, function(index, value) {
					var updateElement={};
				
					//update mode?
					if (settings.update)
					{
						//try to find existing element
						updateElement=$("."+settings.autoListClass+"[_value="+value[settings.indexKey]+"]", parentElement);
						if (updateElement.hasClass(settings.autoListSourceClass))
							updateElement=[];
						logDebug("update element:",updateElement);
					}

					//not found, add new element?
					if (!updateElement.length)
					{
						logDebug("adding new element");
						updateElement=$(sourceElement).clone(true);
						updateElement.removeClass(settings.autoListSourceClass);
						updateElement.insertBefore(sourceElement);
					}

					//now autoPut the element
//and its sibblings
//					updateElement.filter("."+settings.autoPutClass).autoPut(meta, value, settings);
					console.log("ASDFSDF",value,settings);
					$(updateElement).attr("_value", value[settings.indexKey]);
					$("."+settings.autoPutClass, updateElement).autoPut(meta, value, settings);

				});

//				$(sourceElement).hide();
				
				//do we need to delete items?
				if (settings.update)
				{
					//build a map of currenly existing id's
					var idMap={};
					$.each(data, function(key, value) {
						idMap[value[settings.indexKey]]=1;
					});
					
					//traverse all the html list items
					$("."+settings.autoListClass, parentElement).each(function() {
						if (!$(this).hasClass(settings.autoListSourceClass))
						{
							//does not exist anymore?
							if (!idMap[$(this).attr("_value")])
							{
								logDebug("removing element",this);
								$(this).hide('fast',function()
								{
									$(this).remove();
								});
							}
						}
					});
					
				}
				
				//make sure the source element doesnt get processed. (in case of array recursion)
				$("."+settings.autoPutClass, sourceElement).addClass(settings.autoPutedClass);
				$(sourceElement).addClass(settings.autoPutedClass);
//			} //has class
//			else
//			{
//				logDebug("skipped auto listing ", this, " with ",meta,data,settings);
//			}
			
		}); //all list loop
		
		return(ret);
	}


	/*** Auto gets data from the elements and stores it in the value array
	*  Uses _key attribute as hash key
	*/
	$.fn.autoGet = function( meta, value, parentKey ) {  

		logDebug("autoGet called with ", meta, value , parentKey);
		if (!meta)
			return;

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//traverse the specified meta data
			$.each(meta, function(key, thismeta){
				if (thismeta.readonly)
					return;
				
				var keyStr;
				if (parentKey)
					keyStr=parentKey+"."+key;
				else
					keyStr=key;
				
				//find the element that belongs to this key 
				//there SHOULD be only one or zero. 
				var selector='.autoGet[_key="'+keyStr+'"]';
				$(selector, context).each(function() {
					console.log("autogetting", selector, value);
					value[key]=dataConv[thismeta.type].get(this, thismeta, keyStr);
				});
				
			}); //meta
		}); //elements
	}

	/*** Auto puts data from to elements
	*  Uses _key attribute as hash key
	*/
	$.fn.autoPut = function( meta, value, parentKey, options ) {  
		logDebug("autoPut called with ", meta, value , parentKey, options);
		
		var settings = {
			update:false,
			showChanges:false
		};
			
		if ( options ) 
		{ 
			$.extend( settings, options );
		}

		if (!meta)
			return;

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//traverse the specified data
			$.each(value, function(key, thisvalue){
				var keyStr;
				if (parentKey)
					keyStr=parentKey+"."+key;
				else
					keyStr=key;
				
				//find the element that belongs to this key 
				//there SHOULD be only one or zero. 
				var selector='.autoPut[_key="'+keyStr+'"]';
				$(selector, context).each(function() {
					//html only
					if ($(this).attr("_html")!=null)
					{
						var newElement=dataConv[meta[key].type].html(this, meta[key], keyStr, thisvalue, settings);
						if (newElement.text()!=$(this).text())
						{
							$(this).empty();
							$(this).append(newElement);
							if (settings.showChanges)
								$(this).effect('highlight', 2000);
						}
					}
					//put input field
					else
					{
						if (dataConv[meta[key].type].get(this, meta[key], keyStr)!=thisvalue)
						{
							dataConv[meta[key].type].put(this, meta[key], keyStr, thisvalue, settings);
							if (settings.showChanges)
								$(this).effect('highlight', 2000);
						}
					}
				});
			}); //meta
		}); //elements
	}

	/**
	 * Looks up all the fields recursively and returns the element that matches
	 */
	$.fn.autoFindField = function( meta, fields, options ) {  
		return($());
		return(true); //FIXME: aanpassen aan refactoring
		
		var settings = {
			autoListClass: 'autoListItem',
			autoFindClass: 'autoFindClass'
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}
		
		
		//we need to remember which nodes we processed (because of recursion)
		if (!settings.recursed)
		{
			this.addClass(settings.autoFindClass);
			settings.recursed=true;
		}

		var result=$();
		
		//traverse all the elements
		this.each(function() {
			
			//skip if we already processed it
			if ($(this).hasClass(settings.autoFindClass))
			{
				logDebug("auto finding ", fields, " in ", this);

				//prevent us from processing it again (for recursion)
				$(this).removeClass(settings.autoFindClass);
								
				var key=$(this).attr("_key");
				
				//key matches?
				if (key==fields[0])
				{
					//copy array, but without first element
					var recurseFields=fields.slice();
					recurseFields.shift();

					//this was the last field?
					if (recurseFields.length==0)
					{
						result=$(this);
						return (false);
					}
					
					//recurse into hash?
					if (meta[key].type=="hash")
					{
						result=$("."+settings.autoFindClass, this).autoFindField(
							meta[key].meta, recurseFields, settings
						);
						if (result.length)
							return (false);
					}
					
					//recurse into array?
					else if (meta[key].type=="array")
					{
						logDebug("array");
						//get the correct list item
						var itemIndex=(recurseFields[0]+1);
						var listItem=$('.'+settings.autoListClass+':nth-child('+itemIndex+')', this);

						recurseFields.shift();

						//no items left, then return the listItem	
						if (recurseFields.length==0)
						{
							result=listItem;
							return (false);
						}
						
						//recurse into listelement
						result=$("."+settings.autoFindClass, listItem).autoFindField(
							meta[key].meta, recurseFields, settings
						);
						logDebug("recursion result", result);

						if (result.length)
							return (false);						
						
					}
				}
				//key does not match
				else
				{
					//make sure we dont process any subitems inside it (arrays/hash)
					$("."+settings.autoFindClass, this).removeClass(settings.autoFindClass);
				}
			}
			
			//not found
			return(true);
		});
		return (result);
	};

})( jQuery );


