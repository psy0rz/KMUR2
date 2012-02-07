//Convert metadata and normal data from and to the dom-tree


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
			//recurse into sub:
			$(element).autoMeta(meta.meta, keyStr);

			return (null);
		},
		get:function(element, meta, keyStr)
		{
			value=new Object();
			$(element).autoGet(meta.meta, value, keyStr);
			return (value);
		},
		put:function(element, meta, keyStr,value)
		{
			$(element).autoPut(meta.meta, value, keyStr);
		}
	},
	array:{
		/**
		 * Array is a bit of a special case: 
		 * The original element we call the 'source-element', and it is never filled by autoPut.
		 * Instead for every item this original is cloned and then autoPut is called on the cloned item.  
		 * Every cloned item gets a class autoListItem added, but the autoGet/autoPut/autoMeta classes are removed.
		 */
		input:function(element, meta, keyStr)
		{
			//recurse into sub:
			$(element).autoMeta(meta.meta, keyStr);
			return (null);
		},
		get:function(element, meta, keyStr)
		{
			var value=new Array();
			var parent=$(element).parent();
			
			//traverse all the list items
			$('.autoListItem[_key="'+keyStr+'"]', parent).each(function () {
				var subvalue;
				$(element).autoGet(meta.meta, subvalue, keyStr);
				value.push(subvalue);
			});
			return(value);
		},
		put:function(element, meta, keyStr, value)
		{
			var parent=$(element).parent();
			
			//traverse all the list items
			$.each(value, function (index, subvalue) {
				//deep clone it and fix classes
				var clone=element.clone(true);
				clone.removeClass("autoGet");
				clone.removeClass("autoPut");
				clone.removeClass("autoMeta");
				clone.addClass("autoListItem");
				//now put in the data of the subvalue
				$(clone).autoPut(meta.meta, subvalue, keyStr);
				//finally add it to parent element.
				parent.append(clone);
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
			var	addedElement=$("<input>")
				.attr("type","text");
			$(addedElement).val(meta.default);
			addedElement.datepicker({
				dateFormat:'dd-mm-yy',
	//			altFormat:'yy-mm-dd'
			});
			return(addedElement);
		},
		html:function(element, meta, keyStr, value)
		{
			//FIXME
			return($("<span>").text(value));
		},
		get:function(element, meta, keyStr)
		{
			var date=new Date($(element).datepicker("getDate"));
			return(date.getTime()/1000);
		},
		put:function(element, meta, keyStr, value)
		{
			$(element).datepicker("setDate", new Date(value*1000));
		}
	}
}


