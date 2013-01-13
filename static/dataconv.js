//Convert metadata and normal data from and to the dom-tree




//FIXME: put this in dataconv.List.clone
function autoListClone(source)
{
    var clone=$(source).clone(true);
    clone.removeClass("autoGet");
    clone.removeClass("autoPut");
    clone.removeClass("autoMeta");
    clone.removeClass("field-list-source");
    clone.removeClass("field-list-source-hide");
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
                    hour:   date.getHours(),
                    minute: date.getMinutes(),
                    second: date.getSeconds()
                });
    
    return(dateStr);
}


/** Dataconversion functions:
 * First key is the meta-type.
 * Second is the conversion function:
 *      input: Converts specified meta to input element and returns the element.
 *      html: Converts specified value and meta to human readable html and returns the element.
 *      put: Sets the value of the input element to specfied value. (usually created by 'input')
 *      get: Returns the value of the input element. (usually created by 'input')
*/
var dataConv=
{
    //these normally arent called by form.js, since all the functions already know how to handle dicts.
    Dict:{
        input:function (element, meta, keyStr)
        {
            $(element).autoMeta(meta, keyStr);
            return (null);
        },
        html:function(element, meta, keyStr, value)
        {
            return($("<span style='error'>not implemented!</span>"));
        },
        get:function(element, meta, keyStr)
        {
            value=new Object();
            $(element).autoGet(meta, value, keyStr);
            return (value);
        },
        put:function(element, meta, keyStr, value, settings)
        {
            $(element).autoPut(meta, value, keyStr, settings); 
        }
    },
    List:{
        /**
         * List is a bit of a special case: 
         * The original element we call the 'source-element', it should have a field-list-source class.
         * For every item this original is cloned and then autoPut is called on the cloned item.  
         * Every cloned item gets a class autoListItem added, but the other auto-classes are removed.
         * Add a field-list-source-hide class to the source element to hide it. (e.g. user doesnt see a dummy-item)
         * Use the autoListClone() function to correctly clone the source element and fix the classes.
         * 
         * When the data is put, the _id attribute of every cloned list item is set to the value of field
         * that is specified in _index in the list source.
         */
        input:function(element, meta, keyStr)
        {
            //if it is a field-list-source, add autoGet and autoPut for convienience
            if ($(element).hasClass("field-list-source"))
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
            
            //not in update mode
            if (!settings.update)
            {
                if (!settings.noRemove)
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
            if (settings.update)
            {
                $('.autoListDelete[_key="'+keyStr+'"]', parent).hide(1000, function()
                        {
                            $(this).remove();
                        });
            }
        }
    },
    String:{
        input:function(element, meta)
        {
            var added_element;
            if (meta.max>100)
            {
                added_element=$("<textarea>");
            }
            else
            {
                added_element=$("<input>")
                    .attr("type","text");                       
            }

            added_element.attr("_allow_null",$(element).attr("_allow_null"));

            $(added_element).val(meta.default);
            return(added_element);
        },
        html:function(element, meta, keyStr, value)
        {
            return($("<span>").text(value));
        },
        get:function(element, meta, keyStr)
        {
            if ($(element).attr("_allow_null")=="" && $(element).val()=="")
                return (null);
            return($(element).val());
        },
        put:function(element, meta, keyStr, value)
        {
            $(element).val(value);
        }       
    },
    Password:{
        input:function(element, meta)
        {
            var added_element=$("<input>")
                .attr("type","password");
            $(added_element).val(meta.default);
            added_element.attr("_allow_null",$(element).attr("_allow_null"));
            return (added_element);
        },
        html:function(element, meta, keyStr, value)
        {
            return($("<span>").text(value));
        },
        get:function(element, meta, keyStr)
        {
            if ($(element).attr("_allow_null")=="" && $(element).val()=="")
                return (null);
            return($(element).val());
        },
        put:function(element, meta, keyStr, value)
        {
            $(element).val(value);
        }       
    },
    Number:{
        input:function(element, meta)
        {
            //NOTE: we could make this nicer, by showing the decimal point and stuff.
            var added_element=$("<input>")
                    .attr("type","text");
            
            //not neccesary, already returns 0 by no value:
            //added_element.attr("_allow_null",$(element).attr("_allow_null"));
            
            $(added_element).val(meta.default);
            return(added_element);
        },
        html:function(element, meta, keyStr, value)
        {
            return($("<span>").text(value));
        },
        get:function(element, meta, keyStr)
        {
            var val=$(element).val();
            if (val=="")
                return(null)
            else
                return(Number(val));
        },
        put:function(element, meta, keyStr, value)
        {
            $(element).val(value);
        }       
    },
    Select:{
        input:function(element, meta)
        {
            //create select element
            var added_element=$("<select>");

            //allow null choice?
            var allow_null=$(element).attr("_allow_null")=="";
            if (allow_null)
            {
                added_element.attr("_allow_null","");
                var optionElement=$("<option>")
                    .attr("value","")
                optionElement.attr("selected","selected");
                added_element.append(optionElement);
            }
            
            //add choices
            $.each(meta['choices'], function(choice, desc){
                var optionElement=$("<option>")
                    .attr("value",choice)
                    .text(desc);
                
                //we use this instead of added_element.val(thismeta.default) because clone wont work with this.
                if (choice==meta.default &&  !allow_null)
                    optionElement.attr("selected","selected");
                added_element.append(optionElement);
            });
            
            return(added_element);
        },
        html:function(element, meta, keyStr, value)
        {
            var new_element=$("<span>");
            new_element.addClass("autoHtml_"+meta.type+"_"+value);
            new_element.addClass("autoHtml_"+keyStr+"_"+value);
            new_element.text(meta.choices[value]);
            return(new_element);
        },
        get:function(element, meta, keyStr)
        {
            if ($(element).attr("_allow_null")=="" && $(element).prop("selectedIndex")==0)
                return (null);

            return($(element).val());
        },
        put:function(element, meta, keyStr, value)
        {
            $(element).val(value);
        }
    },
    MultiSelect:{
        input:function(element, meta, keyStr)
        {
            var added_element=$("<span>")
                .attr("title",meta.desc);

            added_element.attr("_allow_null",$(element).attr("_allow_null"));

            //add choices
            $.each(meta.choices, function(choice, desc){
                //add checkbox
                var checkbox=$("<input>")
                        .attr("value",choice)
                        .attr("type","checkbox")
                        .attr("id",keyStr+"."+choice);
                        
                if ('default' in meta)
                    checkbox.attr("checked", meta.default.indexOf(choice) != -1);
                added_element.append(checkbox);
                
                //add description
                added_element.append(
                    $("<label>")
                        .attr("for",keyStr+"."+choice)
                        .text(desc)
                );
                
                //add break
                added_element.append($("<br>"));

            });

            return(added_element);
        },
        html:function(element, meta, keyStr, value)
        {
            var new_element=$("<span>");
            
            for(valueI in value)
            {
                new_element.append(
                    $("<span>") 
                        .addClass("autoHtml_"+meta.type)
                        .addClass("autoHtml_"+meta.type+"_"+value[valueI])
                        .addClass("autoHtml_"+keyStr+"_"+value[valueI])
                        .text(meta.choices[value[valueI]])
                );
            }
            return(new_element);
        },
        get:function(element, meta, keyStr)
        {
            var value=new Array();
            
            $("input", element).each(function()
            {
                if ($(this).attr("checked"))
                    value.push($(this).attr("value"));              
            });

            //NOTE: not sure if this how we want it.
            //perhaps its better to add a extra control to 'enable' or 'disable' the checkboxes?
            if ($(element).attr("_allow_null")=="" && value.length==0)
                return (null);
            
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
    Bool:{
        input:function(element, meta)
        {
            if ($(element).attr("_allow_null")=="")
            {
                //if we allow null, we use a select box for it
                return(dataConv['Select']['input'](element, {
                    'choices':{
                        0:meta.false_desc,
                        1:meta.true_desc,
                   }
                }));
            }
            else
            {
                var added_element=$("<input>")
                    .attr("type","checkbox")
                    .attr("value","")
                added_element.attr("checked", meta.default);
                return(added_element);
            }
        },
        html:function(element, meta, keyStr, value)
        {
            var new_element=$("<span>");
            
            if (value)
            {
                new_element.addClass("autoHtml_"+meta.type+"_True");
                new_element.addClass("autoHtml_"+keyStr+"_True");
                new_element.text(meta.true_desc);
            }
            else
            {
                new_element.addClass("autoHtml_"+meta.type+"_False");
                new_element.addClass("autoHtml_"+keyStr+"_False");
                new_element.text(meta.false_desc);
            }
            return (new_element);
        },
        get:function(element, meta, keyStr)
        {
            if ($(element).attr("_allow_null")=="")
            {
                //if we allow null, we use a select box for it
                var value=dataConv['Select']['get'](element, meta, keyStr);
                if (value==null)
                    return (null);

                return(value==1);
            }
            else
            {
                if ($(element).attr("checked"))
                    return(true);
                else
                    return(false);
            }
        },
        put:function(element, meta, keyStr, value)
        {
            if ($(element).attr("_allow_null")=="")
            {
                //if we allow null, we use a select box for it
                dataConv['Select']['put'](element, meta, keyStr, value);
            }
            else
            {
                $(element).attr("checked", value);
            }
        }
    },
    Timestamp:{
        input:function(element, meta)
        {
            var allowTime=false;

            var added_element=$("<input>")
                .attr("type","text");

            added_element.attr("_allow_null",$(element).attr("_allow_null"));
            
            if ($(element).attr("_allowTime")!=null)
            {
                allowTime=true;
                added_element.attr("_allowTime","");
            }
            
            if ('default' in meta)
                $(added_element).val(formatDateTime(meta.default, allowTime));
            
            //create datepicker on demand, to make it clonable:
            //(its probably more efficient as well on long lists)
            added_element.focus(function(){
                if ($(this).closest(".field-list-source").length != 0)
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
            return(added_element);
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

            if ($(element).attr("_allow_null")=="" && $(element).val()=="")
                return(null);

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


