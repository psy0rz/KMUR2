

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
	
	/*** auto create input elements from metadata and add them to the element.
	*  Use _key attribute to specify meta-field.
	*  If _meta is specified, that meta-field will be litterly filled in as text.(usefull for descriptions)
	*/
	$.fn.autoMeta = function( meta , options ) {  

		var settings = {
			autoPutClass: 'autoPut',
//			autoMetaClass: 'autoMeta',
			autoGetClass: 'autoGet',
			autoListClass: 'autoListItem',
			autoListSourceClass: 'autoListSource'
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}
		
		if (!meta)
			return;

		//traverse all specified elements
		return this.each(function() {
			
			//check if it still has an autoMetaClass.
			//(its possible we already processed it, because of recursion for type array or hash)
//			if ($(this).hasClass(settings.autoMetaClass))
//			{
				logDebug("auto creating ", this, " with ",meta,settings);

				//make sure we process it only once.
//				$(this).removeClass(settings.autoMetaClass);
				
				var key=$(this).attr("_key");
				thismeta=resolveMeta(key,meta);
				console.log(thismeta);

				var addedElement;

				
			//	$(this).empty();
				if (thismeta==null)
				{
					if (!key)
						console.error("autoMeta: _key not specified in ",this);
					else if (!thismeta)
						console.error("autoMeta: _key not found in metadata: ",key ,meta);

					addedElement=$("<span>")
						.addClass("autoProgramError")
						.text("unknown _key:"+key);
					$(this).append(addedElement);

				}
				else
				{

					//just fill in the value of the specified metadata-field as plain text?
					if ($(this).attr("_meta"))
					{
						$(this).text(thismeta[$(this).attr("_meta")]);
					}
					else if (thismeta.type=='hash')
					{
						;//dont have to do anything?
						
					}
					else if (thismeta.type=='array')
					{
//						logDebug("autoMeta recursing into array or hash:", key);
						
//						var recurseSettings={};
//						$.extend( recurseSettings, settings );
//						
//						//make sure all the recursed subitems will be readonly as well!
//						if (thismeta.readonly)
//						{
//							recurseSettings.readonly=true;
//						}
//						
//						$("."+settings.autoMetaClass, this).autoMeta(thismeta.meta, recurseSettings);

						if (!thismeta.readonly)
						{
							$(this).addClass(settings.autoGetClass);

	//						//give the autoListsources a autoGet if its not readonly (only used to determine readonly status in autoClick handlers )
	//						$("."+settings.autoListSourceClass, this).addClass(settings.autoGetClass);

						}

						//give all the list sources the autoListItem, so we can recognize all the list items.
		//				$("."+settings.autoListSourceClass, this).addClass(settings.autoListClass);
			
						$(this).addClass(settings.autoPutClass);
						$(this).addClass(settings.autoListSourceClass);
						$(this).addClass(settings.autoListClass);

						
						//				$("."+settings.autoListSourceClass, this).addClass(settings.autoListClass);

		//				logDebug("autoMeta returned from recursion:", key);
					}

					
					else if (thismeta.type=='string')
					{
						if (thismeta['max']==null || thismeta['max']>100)
						{
							addedElement=$("<textarea>");
							$(this).append(addedElement);							
						}
						else
						{
							addedElement=$("<input>")
								.attr("type","text");
									
							$(this).append(addedElement);
						}
						$(addedElement).val(thismeta.default);
					}

					else if (thismeta.type=='password')
					{
						addedElement=$("<input>")
							.attr("type","password");
						$(this).append(addedElement);
						$(addedElement).val(thismeta.default);
					}

					else if (thismeta.type=='float' || thismeta.type=='integer')
					{
						addedElement=$("<input>")
							.attr("type","text");
						$(this).append(addedElement);
						$(this).val(thismeta.default);
					}
					
					else if (thismeta.type=='select')
					{
						//create select element
						addedElement=$("<select>");
						
						//add choices
						$.each(thismeta['choices'], function(choice, desc){
							var optionElement=$("<option>")
								.attr("value",choice)
								.text(desc);
							
							//we use this instead of addedElement.val(thismeta.default) because clone wont work with this.
							if (choice==thismeta.default)
								optionElement.attr("selected","selected");
							addedElement.append(optionElement);
						});
						
						//add results to div
						$(this).append(addedElement);
					}
					
					else if (thismeta.type=='multiselect')
					{
						var parent=$(this);
						//add choices
						$.each(thismeta['choices'], function(choice, desc){
							//add checkbox
							var checkbox=$("<input>")
									.addClass(settings.autoPutClass)
									.attr("value",choice)
									.attr("type","checkbox")
									.attr("_key",key)
									.attr("id",key+"."+choice)
									.attr("title",thismeta['desc'])
									
							if (!thismeta.readonly)
							{
								checkbox.addClass(settings.autoGetClass);
							}

							checkbox.attr("checked", thismeta.default.indexOf(choice) != -1);
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
						addedElement=$("<input>")
							.attr("type","checkbox")
							.attr("value","")
						$(this).append(addedElement);
						addedElement.attr("checked", thismeta.default);
					}

					else if (thismeta.type=='date')
					{
						addedElement=$("<input>")
							.attr("type","text");
						$(this).append(addedElement);
						$(this).val(thismeta.default);
						addedElement.datepicker({
							dateFormat:'dd-mm-yy',
//							altFormat:'yy-mm-dd'
						});
					}


					if (addedElement)
					{
						addedElement.addClass(settings.autoPutClass)
							.attr("_key",key)
							.attr("title",thismeta.desc);
						
						if (!thismeta.readonly && !settings.readonly)
						{
							addedElement.addClass(settings.autoGetClass)
						}
						else
						{
							addedElement.attr('disabled',true);
						}
					}
				}
//			}
//			else
//			{
//				logDebug("skipped auto creating ", this, " with ",meta,settings);
//			}
		});
	};


	/*** Auto fills elements with specified data array
	*  Uses _key attribute to determine which data to fill.
	*  XXX Specify _value to store the value in this attribute instead of the element itself.
	*  Automaticly recognises element-types and uses the correct way to 'fill in the value'.
	*  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
	*  Some meta-types like dates and times are treated specially with datepickers. (conversion from and to timestamps is done by the datpicker )
	*/
	$.fn.autoPut = function( meta , data,  options ) {  

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
	$.fn.autoList = function( meta, data , options ) {

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


	/*** Auto gets data from the elements and stores it in the data array
	*  Uses _key attribute as hash key
	*  Automaticly recognises element-types and uses the correct way to 'get the value'.
	*  (e.g. checkboxes, text-inputs and other html elements are all treated differently)
	*  Some meta-types like dates and times are treated specially with datepickers. (conversion from and to timestamps is done by the datepicker )
	*/
	$.fn.autoGet = function( meta, data , options ) {  

		var settings = {
			autoGetClass:'autoGet',
			autoGotClass:'autoGot',
			autoListClass: 'autoListItem',
			autoListSourceClass: 'autoListSource',
		};
		
		if ( options ) { 
			$.extend( settings, options );
		}
		
		//logDebug("autogegt", $("[key]", settings.context));
		
		//we need to remember which nodes we processed (because of recursion)
		if (!settings.recursed)
		{
			//remove previous autoget-reminders
			$("."+settings.autoGotClass, settings.context).removeClass(settings.autoGotClass);
			settings.recursed=true;
		}

		//traverse all the elements
		return this.each(function() {
			
			//check if we didnt process it yet because of recursion
			if (!$(this).hasClass(settings.autoGotClass))
			{
				//make sure we process it only once.
				$(this).addClass(settings.autoGotClass);

				var key=$(this).attr("_key");
				var strippedKey=stripKey(settings.parentKey, key);
				var thismeta=resolveMeta(strippedKey, meta);
				var value=resolveData(strippedKey, data);

				var elementType=this.nodeName.toLowerCase();

				logDebug("autoGetting ", this, " with ", key, thismeta);

				//recurse into hash array
				if (thismeta.type=="hash")
				{
//					//make sure the array exists
//					if (typeof data[key] != 'array')
//					{
//						data[key]=new Object();
//					}
//					logDebug("autoget recursing into hash");
//					$("."+settings.autoGetClass, this).autoGet(meta[key].meta, data[key], settings);
					; //ignore?
				}
				//recurse into array list
				else if (thismeta.type=="array")
				{
					//make sure the array exists
					if (typeof value != 'array')
						value=new Array();
	
					var parent=$(this).parent();
					
					//make sure we skip the source item + subitems
					$("."+settings.autoListSourceClass, parent).addClass(settings.autoGotClass);
					$("."+settings.autoListSourceClass+" ."+settings.autoGetClass, parent).addClass(settings.autoGotClass);
					
					//traverse all the list items
					logDebug("autoget traversing list");
					$("."+settings.autoListClass, parent).each(function () {
						if (!$(this).hasClass(settings.autoGotClass))
						{
							var itemData={};
							var itemSettings={};
							$.extend( itemSettings, settings );
							itemSettings.parentKey=key;

							$(this).addClass(settings.autoGotClass);

							$("."+settings.autoGetClass, this).autoGet(thismeta.meta, itemData, settings);
							value.push(itemData);
						}
					});
					
//					//make sure we skip the 'source' list item and other crap
//					$("."+settings.autoGetClass, this).addClass(settings.autoGotClass);
				}
				//date (use datepicker)
				else if (thismeta.type=="date")
				{
					var date=new Date($(this).datepicker("getDate"));
					value=date.getTime()/1000;
				}
				else if (elementType=="input")
				{
					if ($(this).attr("type")=="checkbox")
					{
						//value checkbox. add all the selected values to an array
						if ($(this).attr("value"))
						{
							if (typeof value != 'array')
								value=new Array();
							
							if ($(this).attr("checked"))
								value.push($(this).attr("value"));
						}
						//simple boolean 0/1 checkbox:
						else
						{
							if ($(this).attr("checked"))
								value=1;
							else
								value=0;
						}
					}
					else
					{
						//all other inputs can use val:
						value=$(this).val();
					}
				}
				else if (elementType=="select" || elementType=="textarea")
				{
					value=$(this).val();
				}
			}
		});
	}

	/**
	 * Looks up all the fields recursively and returns the element that matches
	 */
	$.fn.autoFindField = function( meta, fields, options ) {  
		
		
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


