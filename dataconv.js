//Convert metadata and normal data from and to the dom-tree


/** Dataconversion functions:
 * First key is the meta-type.
 * Second is the conversion function:
 * 		input: Converts specified meta to input element and returns it.
 * 		html: Converts specified value and meta to human readable html and adds it to $(this).
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
		}
	},
	array:{
		input:function(element, meta, keyStr)
		{
			//recurse into sub:
			$(element).autoMeta(thismeta.meta, keyStr);
			/**
			if (!meta.readonly)
				$(this).addClass(settings.autoGetClass);
			//give all the list sources the autoListItem, so we can recognize all the list items.
			$(this).addClass(settings.autoPutClass);
			$(this).addClass(settings.autoListSourceClass);
			$(this).addClass(settings.autoListClass);
			*/
			return (null);
		},
		get:function(element, meta, keyStr)
		{
			var value=new Array();
			var parent=$(element).parent();
			
//			//make sure we skip the source item + subitems
//			$("."+settings.autoListSourceClass, parent).addClass(settings.autoGotClass);
//			$("."+settings.autoListSourceClass+" ."+settings.autoGetClass, parent).addClass(settings.autoGotClass);
			
			//traverse all the list items
//			logDebug("autoget traversing list");
			$('.autoListItem[_key="'+keyStr+'"]', parent).each(function () {
				var subvalue;
				$(element).autoGet(meta.meta, subvalue, keyStr);
				value.push(subvalue);
			});
			return(value);
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
		get:function(element, meta, value, keyStr)
		{
			return($(element).val());
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
		get:function(element, meta, keyStr)
		{
			return($(element).val());
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
		get:function(element, meta, keyStr)
		{
			return($(this).val());
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
		get:function(element, meta, keyStr)
		{
			return($(this).val());
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
		get:function(element, meta, keyStr)
		{
			return($(this).val());
		}
	},
	multiselect:{
		input:function(element, meta,keyStr)
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
						
				checkbox.attr("checked", this.default.indexOf(choice) != -1);
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
		get:function(element, meta, keyStr)
		{
			var value=new Array();
			
			$("input", this).each(function()
			{
				if ($(this).attr("checked"))
					value.push($(this).attr("value"));				
			});
			
			return(value);
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
		get:function(element, meta, keyStr)
		{
			if ($(this).attr("checked"))
				return(1);
			else
				return(0);
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
		get:function(element, meta, keyStr)
		{
			var date=new Date($(this).datepicker("getDate"));
			return(date.getTime()/1000);
		}
	}
}


