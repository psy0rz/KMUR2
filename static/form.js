

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
	
	/*** Generates html input fields and descriptions from metadata
	*/
	$.fn.autoMeta = function( meta , parentKey ) {  

		
		if (!meta)
			return;

		if (meta.type!="Dict")
		{
			console.error("autoMeta should only be called with metadata of type Dict", meta, value);
			return;
		}

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//traverse the specified meta data
			$.each(meta.meta, function(key, thismeta){
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




	/*** Auto gets data from the elements and stores it in the value array
	*  Uses _key attribute as hash key
	*/
	$.fn.autoGet = function( meta, value, parentKey ) {  

//		console.log("autoGet called with ", meta, value , parentKey, this);
		if (!meta)
			return;

		if (meta.type!="Dict")
		{
			console.error("autoGet should only be called with metadata of type Dict", meta, value);
			return;
		}

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//traverse the specified meta data
			$.each(meta.meta, function(key, thismeta){
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
	//				console.log("autogetting", selector, value, this);
					value[key]=dataConv[thismeta.type].get(this, thismeta, keyStr);
				});
				
			}); //meta
		}); //elements
	}

	/*** Auto puts data into elements
	*  Uses _key attribute as hash key
	*/
	$.fn.autoPut = function( meta, value, parentKey, options ) {  
		// logDebug("autoPut called with ", meta, value , parentKey, options);
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

		if (meta.type!="Dict")
		{
			console.error("autoPut should only be called with metadata of type Dict", meta, value);
			return;
		}

		//traverse all specified elements (usually its just one)
		return this.each(function() {
			var context=this;

			//attach raw data to the object
			//(particulary usefull with arrays and hashes)
			if ($(this).attr("_data")!=null)
			{
				$(this).data("_data",value);
			}

			//traverse the specified data
			//TODO: traverse metadata instead of normal data, like in autoGet and autoMeta?
			$.each(value, function(key, thisvalue){
				var keyStr;
				if (parentKey)
					keyStr=parentKey+"."+key;
				else
					keyStr=key;


				if (key in meta.meta)
				{
					//find the element that belongs to this key 
					//there SHOULD be only one or zero. 
					var selector='.autoPut[_key="'+keyStr+'"]';
					$(selector, context).each(function() {
						if (meta.meta[key].type in dataConv)
						{
							//generate html
							if ($(this).attr("_html")!=null)
							{
	//							console.log("check", meta.meta, key);
								var newElement=dataConv[meta.meta[key].type].html(this, meta.meta[key], keyStr, thisvalue, settings);
								if (newElement.text()!=$(this).text())
								{
									$(this).empty();
									$(this).append(newElement);
									if (settings.showChanges)
										$(this).effect('highlight', 2000);
								}
							}
							//put data into existing input fields (or arrays or hashes)
							else
							{
	//							if (dataConv[meta.meta[key].type].get(this, meta.meta[key], keyStr)!=thisvalue)
	//							{
									dataConv[meta.meta[key].type].put(this, meta.meta[key], keyStr, thisvalue, settings);
									//FIXME: (werkt niet met array in test/list) if (settings.showChanges)
									//	$(this).effect('highlight', 2000);
	//							}
							}
						}
						else
						{
							console.error("Metadata has unknown type: ", meta.meta[key]);
							return false;
						}
					});
				}
			}); //meta
		}); //elements
	}

	/**
	 * Looks up the element that matches the keys array within the specified context
	 * array items are noted by a number.
	 * example: [ "test", 5, "bla" ]
	 * This selects the bla key in the 5th element of the test array.
	 * This notation is also used by errors that are returned from the server.
	 */
	$.fn.autoFindElement = function( meta, keys) {  
		// logDebug("autofind called with ", meta, keys);
		
		var elements=this;
		var keyStr='';
		var thismeta=meta;
		$.each(keys, function(index, key)
		{
			if (typeof key == "string")
			{
				if (keyStr!='')
					keyStr+='.'+key;
				else
					keyStr=key;
								
				//NOTE: hack - this logic probably belongs in dataconv as well?
				var nextelement=$('.autoGet[_key="'+keyStr+'"]', elements);
				if (nextelement.hasClass("autoListSource"))
					elements=$('.autoListItem[_key="'+keyStr+'"]', elements);
				else
					elements=nextelement;
				
			}
			else if (typeof key == "number")
			{
				elements=elements.eq(key);
			}
//			console.log("autofind ", key, elements);
		});
		return (elements);
	}; 
	
	/**
	 * Looks up the keys that belong to the specified element 
	 * array items are noted by a number.
	 * example: [ "test", 5, "bla" ]
	 */
	$.fn.autoFindKeys = function( meta) {  
		var element=this;
		var count=$(element).attr("_key").split('.').length;
		
		
		var fields=[];
		
		while(count)
		{
//			console.log("element ", element, "count ", count);

			//its a listitem..determine the itemnumber.
			if (element.hasClass("autoListItem"))
			{
				var listIndex=0;
				//NOTE: hack - this logic probably belongs in dataconv as well?
				$(element).parent().children('.autoListItem[_key="'+$(element).attr("_key")+'"]').each(function(index, listitem)
						{
//							console.log("compare1 ",listitem);
//							console.log("compare2 ",element);
							if (listitem===element[0])
							{
//								console.log("w00t");
								listIndex=index;
								return(false);
							}
							listIndex++;
						});
				fields.unshift(listIndex);
			}

			//add last field of keystring to the beginning of the fields array:
			fields.unshift($(element).attr("_key").split('.').pop());
		
			//goto next closest parent element
			element=$(element).parent().closest("[_key]");
			count--;
		}
//		console.log("fields",fields);
		return(fields);
	};
	
})( jQuery );


