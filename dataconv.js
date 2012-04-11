//Convert metadata and normal data from and to the dom-tree


function autoListClone(source)
{
	var clone=$(source).clone(true);
	clone.removeClass("autoGet");
	clone.removeClass("autoPut");
	clone.removeClass("autoMeta");
	clone.removeClass("autoListSource");
	clone.removeClass("autoListHide");
	clone.addClass("autoListItem");
	
	
	return(clone);
}


var defaultDateFormat='dd-mm-yy';
var defaultTimeFormat='hh:mm';


function formatDateTime(timestamp, allowTime)
{
	var date=new Date(timestamp*1000);
	var dateStr=$.datepicker.formatDate( defaultDateFormat, date );

	if (allowTime)
		dateStr+=" "+$.datepicker.formatTime( defaultTimeFormat, 
				{
					hour:	date.getHours(),
					minute:	date.getMinutes(),
					second: date.getSeconds()
			 	});
	
	return(dateStr);
}


/** Dataconversion functions:
 * First key is the meta-type.
 * Second is the conversion function:
 * 		input: Converts specified meta to input element and returns the element.
 * 		html: Converts specified value and meta to human readable html and returns the element.
 * 		put: Sets the value of the input element to specfied value. (usually created by 'input')
 * 		get: Returns the value of the input element. (usually created by 'input')
*/
var dataConv=
{
	hash:{
		input:function (element, meta, keyStr)
		{
			//add autoGet and autoPut for convienience
			if (!meta.readonly)
			{
				$(element).addClass("autoGet");
			}
			$(element).addClass("autoPut");

			//recurse into sub:
			$(element).autoMeta(meta.meta, keyStr);
			return (null);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span style='error'>not implemented!</span>"));
		},
		get:function(element, meta, keyStr)
		{
			value=new Object();
			$(element).autoGet(meta.meta, value, keyStr);
			return (value);
		},
		put:function(element, meta, keyStr, value, settings)
		{
			$(element).autoPut(meta.meta, value, keyStr, settings);
		}
	},
	array:{
		/**
		 * Array is a bit of a special case: 
		 * The original element we call the 'source-element', it should have a autoListSource class.
		 * For every item this original is cloned and then autoPut is called on the cloned item.  
		 * Every cloned item gets a class autoListItem added, but the other auto-classes are removed.
		 * Add a autoListHide class to the source element to hide it. (e.g. user doesnt see a dummy-item)
		 * Use the autoListClone() function to correctly clone the source element and fix the classes.
		 * 
		 * When the data is put, the _id attribute of every cloned list item is set to the value of field
		 * that is specified in _index in the list source.
		 */
		input:function(element, meta, keyStr)
		{
			//if it is a autoListSource, add autoGet and autoPut for convienience
			if ($(element).hasClass("autoListSource"))
			{
				if (!meta.readonly)
				{
					$(element).addClass("autoGet");
				}
				$(element).addClass("autoPut");
			}
			//recurse into sub:
			$(element).autoMeta(meta.meta, keyStr);
			return (null);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span style='error'>not implemented!</span>"));
		},
		get:function(element, meta, keyStr)
		{
			var value=new Array();
			var parent=$(element).parent();
			
			//traverse all the list items
			$('.autoListItem[_key="'+keyStr+'"]', parent).each(function () {
				var subvalue=new Object();
				$(this).autoGet(meta.meta, subvalue, keyStr);
				value.push(subvalue);
			});
			return(value);
		},
		put:function(element, meta, keyStr, value, settings)
		{
			var parent=$(element).parent();
			var index=$(element).attr("_index");
			var listItems;

			
			if ($(element).attr("_key")==null)
			{
				$(element).attr("_key","");
			}
			
			//not in update mode, so clear any existing items
			if (!settings.update)
			{
				$('.autoListItem[_key="'+keyStr+'"]', parent).remove();
			}
			//in update mode, add a marker to remember which stuff can be deleted
			else
			{
				$('.autoListItem[_key="'+keyStr+'"]', parent).addClass("autoListDelete");
				if (!index)
				{
					//we dont have a index, so create a array of all items to use plain array adressing mode
					listItems=$('.autoListItem[_key="'+keyStr+'"]', parent);
				}
			}
			
			//for performance, prepare a listitem one time and clone that.
			var clone=autoListClone(element);
			
			//traverse all the list items
			$.each(value, function (itemNr, subvalue) {
				
				var updateElement={};
				
				//update mode, with index:
				if (settings.update)
				{
					if (index)
					{
						//try to find existing element
						//the _key and _id should both match
						updateElement=$('.autoListItem[_key="'+keyStr+'"][_id="'+subvalue[index]+'"]', parent);
					}
					else
					{
						//just use plain itemNr array adressing:
						updateElement=$(listItems[itemNr]);
					}
				}
				
				//not found, clone new element?
				if (!updateElement.length)
				{
					//deep clone the prepared clone
					updateElement=clone.clone(true);
					if (index)
						$(updateElement).attr("_id", subvalue[index]);
					//we append before we do other stuff with the element. This is because effects and stuff dont work otherwise.
					//can we improve performance a lot by appending after the autoPut?
					updateElement.insertBefore(element);
				}
				//found, make sure its not deleted
				else
				{
					if (settings.update)
						updateElement.removeClass("autoListDelete");
				}
				
				//put data into it
				$(updateElement).autoPut(meta.meta, subvalue, keyStr, settings);
			});			
			
			//delete stuff that still has the delete-marker in it:
			$('.autoListDelete[_key="'+keyStr+'"]', parent).hide(1000, function()
					{
						$(this).remove();
					});				
		}
	},
	string:{
		input:function(element, meta)
		{
			var addedElement;
			if (meta['max']==null || meta.max>100)
			{
				addedElement=$("<textarea>");
			}
			else
			{
				addedElement=$("<input>")
					.attr("type","text");						
			}
			$(addedElement).val(meta.default);
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span>").text(value));
		},
		get:function(element, meta, keyStr)
		{
			return($(element).val());
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).val(value);
		}		
	},
	password:{
		input:function(element, meta)
		{
			var addedElement=$("<input>")
				.attr("type","password");
			$(addedElement).val(meta.default);
			return (addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span>").text(value));
		},
		get:function(element, meta, keyStr)
		{
			return($(element).val());
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).val(value);
		}		
	},
	float:{
		input:function(element, meta)
		{
			var addedElement=$("<input>")
					.attr("type","text");
			$(addedElement).val(meta.default);
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span>").text(value));
		},
		get:function(element, meta, keyStr)
		{
			return($(element).val());
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).val(value);
		}		
	},
	integer:{
		input:function(element, meta)
		{
			var addedElement=$("<input>")
					.attr("type","text");
			$(addedElement).val(meta.default);
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			return($("<span>").text(value));
		},
		get:function(element, meta, keyStr)
		{
			return($(element).val());
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).val(value);
		}		
	},
	select:{
		input:function(element, meta)
		{
			//create select element
			var addedElement=$("<select>");
			
			//add choices
			$.each(meta['choices'], function(choice, desc){
				var optionElement=$("<option>")
					.attr("value",choice)
					.text(desc);
				
				//we use this instead of addedElement.val(thismeta.default) because clone wont work with this.
				if (choice==meta.default)
					optionElement.attr("selected","selected");
				addedElement.append(optionElement);
			});
			
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			var newElement=$("<span>");
			newElement.addClass("autoHtml_"+meta.type+"_"+value);
			newElement.addClass("autoHtml_"+keyStr+"_"+value);
			newElement.text(meta.choices[value]);
			return(newElement);
		},
		get:function(element, meta, keyStr)
		{
			return($(element).val());
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).val(value);
		}
	},
	multiselect:{
		input:function(element, meta, keyStr)
		{
			var addedElement=$("<span>")
				.attr("title",meta.desc);

			//add choices
			$.each(meta.choices, function(choice, desc){
				//add checkbox
				var checkbox=$("<input>")
						.attr("value",choice)
						.attr("type","checkbox")
						.attr("id",keyStr+"."+choice);
						
				checkbox.attr("checked", meta.default.indexOf(choice) != -1);
				addedElement.append(checkbox);
				
				//add description
				addedElement.append(
					$("<label>")
						.attr("for",keyStr+"."+choice)
						.text(desc)
				);
				
				//add break
				addedElement.append($("<br>"));

			});

			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			var newElement=$("<span>");
			
			for(valueI in value)
			{
				newElement.append(
					$("<span>")	
						.addClass("autoHtml_"+meta.type)
						.addClass("autoHtml_"+meta.type+"_"+value[valueI])
						.addClass("autoHtml_"+keyStr+"_"+value[valueI])
						.text(meta.choices[value[valueI]])
				);
			}
			return(newElement);
		},
		get:function(element, meta, keyStr)
		{
			var value=new Array();
			
			$("input", element).each(function()
			{
				if ($(this).attr("checked"))
					value.push($(this).attr("value"));				
			});
			
			return(value);
		},
		put:function(element, meta, keyStr, value)
		{
			$("input", element).each(function()
			{
				//set checked to true if the value of the checkbox is found in the value passed to this function:
				$(this).attr("checked", (value.indexOf($(this).attr("value")) != -1));
			});
		}
	},
	bool:{
		input:function(element, meta)
		{
			var addedElement=$("<input>")
				.attr("type","checkbox")
				.attr("value","")
			addedElement.attr("checked", meta.default);
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			var newElement=$("<span>");
			
			if (value)
			{
				newElement.addClass("autoHtml_"+meta.type+"_True");
				newElement.addClass("autoHtml_"+keyStr+"_True");
				newElement.text("Ja");
			}
			else
			{
				newElement.addClass("autoHtml_"+meta.type+"_False");
				newElement.addClass("autoHtml_"+keyStr+"_False");
				newElement.text("Nee");
			}
			return (newElement);
		},
		get:function(element, meta, keyStr)
		{
			if ($(element).attr("checked"))
				return(1);
			else
				return(0);
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).attr("checked", value==1);
		}
	},
	date:{
		input:function(element, meta)
		{
			var allowTime=false;

			var	addedElement=$("<input>")
			.attr("type","text");
			
			if ($(element).attr("_allowTime")!=null)
			{
				allowTime=true;
				addedElement.attr("_allowTime","");
			}
			
			if ('default' in meta)
				$(addedElement).val(formatDateTime(meta.default, allowTime));
			
			//create datepicker on demand, to make it clonable:
			//(its probably more efficient as well on long lists)
			addedElement.focus(function(){
				if ($(this).closest(".autoListSource").length != 0)
					return;
				
				if (allowTime)
				{
					//date AND time picker:
					$(this).datetimepicker({
						dateFormat:defaultDateFormat,
						timeFormat:defaultTimeFormat,
						onClose: function(dateText, inst) 
						{
							$(this).datetimepicker("destroy");
							$(this).attr("id",null);
						}
					}).datetimepicker("show");
				}
				else
				{
					//date picker only:
					$(this).datepicker({
						dateFormat:defaultDateFormat,
						onClose: function(dateText, inst) 
						{
							$(this).datepicker("destroy");
							$(this).attr("id",null);
						}
					}).datepicker("show");
				}
				
			});
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			if (value!="")
			{
				return($("<span>").text(formatDateTime(value, ($(element).attr("_allowTime")!=null))));
			}
			else
				return($("<span>"));
		},
		get:function(element, meta, keyStr)
		{
			//var dateStr=$(element).val().split()
			//var date=new Date($(element).datepicker("getDate"));
			//return($.datepicker.parseDate(defaultDateFormat+" "+defaultTimeFormat, $(element).val())/1000);
			//return(Date.parse()/1000);
			return(Date.parse(
					$.datepicker.parseDateTime(defaultDateFormat, defaultTimeFormat, $(element).val())
				)/1000);
		},
		put:function(element, meta, keyStr, value)
		{
			if (value!='')
			{

				$(element).val(formatDateTime(value, ($(element).attr("_allowTime")!=null)));
			}
			else
				$(element).val("");
		}
	}
}


