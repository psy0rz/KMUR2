/////////////////////////////////////////////////////////////////////////////////////////////

/*** All fieldtypes are stored in a dictorany so we can easily look them up.
*/
Field={};


/*** Fields base prototype
    Most publicly callable functions have these parameters:
        key         :key of the specified meta data in dotted notation. Usually also stored in context.attr("field-key")
        meta        :meta-data 
        context     :jquery dom element to operate on or in
        data        :data to put in
*/
Field.Base={};

//adds key to basekey, using dotted notation
Field.Base.concat_keys=function(base_key, key)
{
        if (base_key)
            return(base_key+"."+key);
        else
            return(key);
}

/*** generic function thats used when something is not implemented. 

    tries to make the error visible and logs it to the console.
    */
Field.Base.not_implemented=function(key, meta, context, data)
{
    //context.empty();
    context.append($("<span class='ui-state-highlight'>datatype not implemented: "+meta.type+"</span>"));
    console.error("unimplemented datatype in field "+key+": ", meta, context, data);
}

/*** put metadata into context
 
    the base implementation just litteraly puts the data specified in the field-meta-key attribute into the context.text().

    it returns false if there is no field-meta-key specified. 

    subclasses usually first call this base implemenation, and when it returns false, the subclass will then dynamicly create a correct input field from the metadata.

    context should have class field-meta-put

    context may have an attribute called 'field-meta-key'.

    dynamicly created input fields get a field-input class, so that .put knows its a inputfield instead of a normal html field

*/
Field.Base.meta_put=function(key, meta, context)
{
    console.log("meta_put", key, meta, context);
    var meta_key=context.attr("field-meta-key");
    if (meta_key==undefined)
    {
        return(false);
    }
    else
    {
        if (meta_key in meta)
            context.text(meta[meta_key]);
        else
            context.text("");

        return (true);
    }
}

/*** appends specified jquery input element into the jquery context

    mostly used internally by subclasses that overload meta_put.

    this will modify the specified element as well!

    automaticly sets field-key attribute.

    when meta.readonly is not true, automaticly adds field-get class, otherwise disables input element.

    automaticly sets title to meta.desc.

    if context has field-allow-null attribute, then the element will get it as well
    */ 
Field.Base.input_append=function(key, meta, context, element)
{
    element.addClass("field-input field-put");
    element.attr("field-key", key);
    element.attr("title", meta.desc);
    
    if (!meta.readonly)
    {
        element.addClass("field-get");
    }
    else
    {
        element.attr('disabled',true);
    }

    if (context.attr("field-allow-null")=="")
    {
        element.attr("field-allow-null", "");
    }

    context.empty();
    context.append(element);
};


/*** stores specified element or string in context

    mostly used internally by put.

    if options.show_changes is true, then it highlights the field if it has gotten a different content.

    element can be a jquery object or a string. if its a string then context.text() will be used to
    set the element. otherwise the content will be emptied and the element will be added.

    */ 
Field.Base.html_append=function(key, meta, context, data, options, element)
{
    //probably a jquery object
    // console.log("html_append", key , meta, context, data , options, element);
    if (element instanceof jQuery)
    {
        if (element.text()!=context.text())
        {
            context.empty();
            context.append(element);
            if (options.show_changes)
                context.effect('highlight', 2000);
        }
    }
    else
    {
        if (element!=context.text())
        {
            context.text(element);
            if (options.show_changes)
                context.effect('highlight', 2000);
        }
    }

}


/*** puts data into a context

    context should have class field-put

    if the field-nput class is set on the context, then the current content is assumed to be a input-field that was created with meta_put.
    the existing input elements will then be filled with the data.

    otherwise the data and metadata will be converted to a html representation and stored in the context.

    */

Field.Base.put=Field.Base.not_implemented;//(key, meta, context, data, options)


/*** gets data from content.

    context must contain input-elements that where created with input_create.
    context should have class field-get
*/
Field.Base.get=Field.Base.not_implemented;//(key, meta, context)







/////////////////////////////////////////////////////////////////////////////////////////////
/*** Dictonary type. This is usually the base fieldtype we start with. (the "root" of the meta-data)
    This fieldtype is recursive, so its allowed for meta data to have Dicts in Dicts.

    Note that Dict is the only field-type where the context-parameter doesnt actually point directly to a field element,
    but rather points to a dom element that contains children which are fields.

*/
Field.Dict=Object.create(Field.Base);


//a dict will traverse all the sub-metadata items
Field.Dict.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Base.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            Field.Dict.meta_put(key_str, thismeta, context);
        }
        else
        {
            var selector='.field-meta-put[field-key="'+key_str+'"]';
             //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                Field[thismeta.type].meta_put(key_str, thismeta, $(this));
            });
        }
    }); //meta data
};


//-options.show_changes: highlight changed data 
//if the context has the class field-dict-raw, then also the raw data is stored in the field-data data-attribute.
Field.Dict.put=function(key, meta, context, data, options)
{
    //also store raw input?
    if (context.hasClass("field-dict-raw"))
    {
        context.data("field-data",data);
    }

    //traverse the data
    $.each(data, function(sub_key, thisdata){
        var key_str=Field.Base.concat_keys(key, sub_key);
        var thismeta=meta.meta[sub_key];
        if (thismeta!=undefined)
        {

            if (thismeta.type=='Dict')
            {
                //for subdicts, we stay in the same context while we recurse:
                Field.Dict.put(key_str, thismeta, context, thisdata, options);
            }
            else
            {
                var selector='.field-put[field-key="'+key_str+'"]';

                //traverse the field-meta-put elements for this key:
                $(selector, context).each(function()
                {
                    Field[thismeta.type].put(key_str, thismeta, $(this), thisdata, options);
                });
            }
        }
    }); //meta data
};

Field.Dict.get=function(key, meta, context)
{
    var ret={};

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Base.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            ret[sub_key]=Field.Dict.get(key_str, thismeta, context);
        }
        else
        {
            var selector='.field-get[field-key="'+key_str+'"]';

            //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                ret[sub_key]=Field[thismeta.type].get(key_str, thismeta, $(this));
            }); 
        }
    }); //meta data

    return(ret);
};

/*
//-options.show_changes: highlight changed data 
Field.Dict.html_create=function(key, meta, context, data, options)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        
        if (thismeta.type=='Dict')
        {
            Field.Dict.html_create(key_str, thismeta, context, data[sub_key], options);
        }
        else
        {
            var selector='.field-html-create[field-key="'+key_str+'"]';

            //traverse the field-input-create elements for this key:
            $(selector, context).each(function()
            {
                Field[thismeta.type].html_create(key_str, thismeta, $(this), data[sub_key], options);
            });
        }
    }); 

};
*/

/////////////////////////////////////////////////////////////////////////////////////////////
/**
 * List is a bit of a special case: 
 * The original element we call the 'source-element', it should have a field-list-source class. 
 * meta_put will make sure of this.
 * 
 * When calling put, the source-element will be cloned, and put will be called recursively 
 * with this cloned item as context.
 *
 * Every cloned item gets the class field-list-item, but the other field-classes are removed. otherwise
 * the rest of the fieldfunctions would get confused about these clones.
 *
 * Add a field-list-source-hide the source element to hide it. (e.g. user doesnt see a dummy-item)
 * 
 * Use Field.List.Clone to correctly clone a source element.
 * 
 * When the data is put, the field-list-id attribute of every cloned list item is set to the value of field
 * that is specified in field-list-key in the list source.
 */
Field.List=Object.create(Field.Base);

// correctly clones the specified field-list-source and resturns it
// source should be a jquery object
Field.List.clone=function(source_element)
{
    var clone=source_element.clone(true);
    clone.removeClass("field-input-create field-get field-put field-meta-put field-list-source field-list-source-hide");
    clone.addClass("field-list-item");
    return(clone);

}

Field.List.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    context.addClass("field-list-source");

    if (!meta.readonly)
        context.addClass("field-get");

    context.addClass("field-put field-input");
    //recurse into subdict, every list should have one
    Field.Dict.meta_put(key, meta.meta, context);
};

/*
 options.list_update: update an existing list, instead off removing and recreating it. 
 usefull with options.show_changes, to give user feedback of changes.

 options.list_no_remove: dont remove existing items. usefull for endless scrolling.
*/

Field.List.put=function(key, meta, context, data, options)
{
    var parent=context.parent();
    var list_key=context.attr("field-list-key");

    //if no list_key specified, try to get it from the metadata 
    if (!list_key && meta.list_key)
        list_key=meta.list_key;

    //existing list items (if any)
    var existing_items=$('.field-list-item[field-key="'+key+'"]', parent);
    
    //not in update mode
    if (!options.list_update)
    {
        //remove existing listitems
        if (!options.list_no_remove)
            existing_items.remove();
    }
    //in update mode, add a marker to remember which stuff can be deleted
    else
    {
        existing_items.addClass("field-list-delete");
    }
    
    //for performance, prepare a listitem one time and clone that.
    var clone=Field.List.clone(context);
    
    //traverse all the new list items
    if (data)
    {
        $.each(data, function (item_nr, item_value) {
            
            //this will become a new or existing item that needs to be filled with data
            var update_element=undefined;
            
            //update mode
            if (options.list_update)
            {
                if (list_key)
                {
                    //try to find existing element
                    //the field-key and field-list-id should both match
                    update_element=$('.field-list-item[field-key="'+key+'"][field-list-id="'+item_value[list_key]+'"]', parent);
                    if (update_element.length==0)
                        update_element=undefined;
                }
                else
                {
                    //just use plain item_nr array adressing:
                    if (item_nr < existing_items.length)
                        update_element=existing_items[item_nr];
                }
            }
            
            //not found? clone new element
            if (update_element==undefined)
            {
                //deep clone the prepared clone
                update_element=clone.clone(true);

                if (list_key)
                    update_element.attr("field-list-id", item_value[list_key]);
                else
                    update_element.attr("field-list-id", item_nr);


                //we append before we do other stuff with the element. This is because effects and stuff dont work otherwise.
                //NOTE: can we improve performance a lot by appending after the put on cloned items?
                update_element.insertBefore(context);
            }
            //found, make sure its not deleted
            else
            {
                if (options.list_update)
                    update_element.removeClass("field-list-delete");
            }
            
            //finally put data into it
            Field[meta.meta.type].put(key, meta.meta, update_element, item_value, options);
        });
    }
    
    //delete stuff that still has the delete-marker in it:
    if (options.list_update)
    {
        $('.field-list-delete[field-key="'+key+'"]', parent).hide(1000, function()
                {
                    $(this).remove();
                });
    }
}

Field.List.get=function(key, meta, context)
{
    var value=new Array();
    var parent=context.parent();
    
    //traverse all the list items
    $('.field-list-item[field-key="'+key+'"]', parent).each(function(){
        value.push(Field.Dict.get(key, meta, $(this)));
    });
    return(value);    
}

/*** Gets a reference to the list-item-element, by resolving the specified elelment.
*/
Field.List.from_element_get=function(element)
{
    return($(element).closest(".field-list-item, .field-list-source"));
}

/***  Adds a new list item, by resolving the list that belongs to the specfied element.

It will always make sure the field-list-source stays at the end of the list.

Also returns a reference to the new item.
*/
Field.List.from_element_add=function(element)
{
    var list_item=Field.List.from_element_get(element);

    if (list_item.length==0)
        return;

    var source_item=list_element.parent().children(".field-list-source");

    var add_item=Field.List.Clone(source_item);

    if (list_element.hasClass("field-list-source"))
        add_item.insertBefore(list_item);
    else
        add_item.insertAfter(list_item);

    return(add_item);
};

/////////////////////////////////////////////////////////////////////////////////////////////
Field.String=Object.create(Field.Base);

Field.String.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    var new_element;
    if (meta.max>100)
    {
        new_element=$("<textarea>");
    }
    else
    {
        new_element=$("<input>")
            .attr("type","text");                       
    }

    new_element.val(meta.default);

    Field.Base.input_append(key, meta, context, new_element);
}


Field.String.get=function(key, meta, context)
{
    var val=context.val();

    if (context.attr("field-allow-null")  && val=="")
                return (null);

    return (val);
}

Field.String.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
        context.val(data);
    else
        Field.Base.html_append(key, meta, context, data, options, data);
}




/////////////////////////////////////////////////////////////////////////////////////////////
//Password is almost the same as String
Field.Password=Object.create(Field.String);

Field.Password.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    var new_element;
        new_element=$("<input>")
            .attr("type","password"); 

    new_element.val(meta.default);
    Field.Base.input_append(key, meta, context, new_element);
}


/////////////////////////////////////////////////////////////////////////////////////////////

Field.Number=Object.create(Field.String);
Field.Number.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    var new_element;
    new_element=$("<input>")
        .attr("type","text");                       

    new_element.val(meta.default);

    Field.Base.input_append(key, meta, context, new_element);
}



Field.Number.get=function(key, meta, context)
{
    var val=context.val();
    if (val=="")
        return(null)
    else
        return(Number(val));

}


///////////////////////////////////////////////////
Field.Select=Object.create(Field.Base);
Field.Select.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    //create select element
    var new_element=$("<select>");

    //allow null choice?
    var allow_null=context.attr("field-allow-null")=="";
    if (allow_null)
    {
        var option_element=$("<option>")
            .attr("value","")
        option_element.attr("selected","selected");
        new_element.append(option_element);
    }
    
    //add choices
    $.each(meta['choices'], function(choice, desc){
        var option_element=$("<option>")
            .attr("value",choice)
            .text(desc);
        
        //we use this instead of new_element.val(thismeta.default) because clone wont work with this.
        if (choice==meta.default &&  !allow_null)
            option_element.attr("selected","selected");
        new_element.append(option_element);
    });
            
    Field.Base.input_append(key, meta, context, new_element);
}


Field.Select.get=function(key, meta, context)
{

    if (context.attr("field-allow-null")=="" && context.prop("selectedIndex")==0)
        return (null);

    return(context.val());
}

Field.Select.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
        context.val(data);
    else
    {
        var new_element=$("<span>");
        new_element.addClass("field-select-"+data);
        new_element.addClass("field-select-"+key+"-"+data);
        new_element.text(meta.choices[data]);
        Field.Base.html_append(key, meta, context, data, options, new_element);
    }
}



///////////////////////////////////////////////////
Field.Bool=Object.create(Field.Base);
Field.Bool.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    if (context.attr("field-allow-null")=="")
    {
        //if we allow null, we use a select box for it
        Field.Select.meta_put(key,
                {
                    'choices':{
                        0:meta.false_desc,
                        1:meta.true_desc
                    }
                }, 
                context);
    }
    else
    {
        var new_element=$("<input>")
            .attr("type","checkbox")
            .attr("value","")
        new_element.attr("checked", meta.default);
        Field.Base.input_append(key, meta, context, new_element);
    }
}


Field.Bool.get=function(key, meta, context)
{

    if (context.attr("field-allow-null")=="")
    {
        //if we allow null, we use a select box for it
        var value=Field.Select.get(key ,meta, context);
        if (value==null)
            return (null);

        return(value==1);
    }
    else
    {
        if (context.attr("checked"))
            return(true);
        else
            return(false);
    }
}

Field.Bool.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
    {
            if (context.attr("field-allow-null")=="")
            {
                //if we allow null, we use a select box for it
                Field.Select.put(key, meta, context, data, options);
            }
            else
            {
                context.attr("checked", data);
            }
    }
    else
    {
        var new_element=$("<span>");
        
        if (data)
        {
            new_element.addClass("field-bool-true");
            new_element.addClass("field-bool-"+key+"-true");
            new_element.text(meta.true_desc);
        }
        else
        {
            new_element.addClass("field-bool-false");
            new_element.addClass("field-bool-"+key+"-false");
            new_element.text(meta.false_desc);
        }

        Field.Base.html_append(key, meta, context, data, options, new_element);
    }
}



///////////////////////////////////////////////////
Field.MultiSelect=Object.create(Field.Base);
Field.MultiSelect.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;

    var new_element=$("<span>")
        .attr("title",meta.desc);


    //add choices
    $.each(meta.choices, function(choice, desc){
        var label=$("<label>").text(desc);

        //add checkbox
        var checkbox=$("<input>")
                .attr("value",choice)
                .attr("type","checkbox");

        if ('default' in meta)
            checkbox.attr("checked", meta.default.indexOf(choice) != -1);

        label.append(checkbox);
        new_element.append(label);
                
        //add break
        //TODO: do this with css via a field-multiselect-bla class or something?
        new_element.append($("<br>"));
    });

    Field.Base.input_append(key, meta, context, new_element);
}


Field.MultiSelect.get=function(key, meta, context)
{
    var value=new Array();
    
    $("input", context).each(function()
    {
        if ($(this).attr("checked"))
            value.push($(this).attr("value"));              
    });

    //NOTE: not sure if this how we want it.
    //perhaps its better to add a extra control to 'enable' or 'disable' the checkboxes?
    if (context.attr("field-allow-null")=="" && value.length==0)
        return (null);
    
    return(value);
}

Field.MultiSelect.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
    {
        $("input", context).each(function()
        {
            //set checked to true if the value of the checkbox is found in the value passed to this function:
            $(this).attr("checked", (data.indexOf($(this).attr("value")) != -1));
        });
    }
    else
    {
        var new_element=$("<span>");
        
        for(data_nr in data)
        {
            new_element.append(
                $("<span>") 
                    .addClass("field-multiselect")
                    .addClass("field-multiselect-"+data[data_nr])
                    .addClass("field-multiselect-"+key+"-"+data[data_nr])
                    .text(meta.choices[data[data_nr]])
            );
        }

        Field.Base.html_append(key, meta, context, data, options, new_element);
    }
}


/////////////////////////////////////////////////////////////////////////
Field.Timestamp=Object.create(Field.Base);

Field.Timestamp.defaultDateFormat='dd-mm-yy';
Field.Timestamp.defaultTimeFormat='hh:mm';

Field.Timestamp.meta_put=function(key, meta, context)
{
    if (Field.Base.meta_put(key, meta, context))
        return;


    var allowTime=false;

    var new_element=$("<input>")
        .attr("type","text");

    if (context.attr("field-timestamp-allow-time")!=null)
    {
        allowTime=true;
        new_element.attr("field-timestamp-allow-time","");
    }
    
    if ('default' in meta)
        new_element.val(formatDateTime(meta.default, allowTime));
    
    //create datepicker on demand, to make it clonable:
    //(its probably more efficient as well on long lists)
    new_element.focus(function(){
        //we probably never wabt activate inside of a list-source
        if ($(this).closest(".field-list-source").length != 0)
            return;
        
        if (allowTime)
        {
            //date AND time picker:
            $(this).datetimepicker({
                dateFormat:Field.Timestamp.defaultDateFormat, //make configurable via attributes?
                timeFormat:Field.Timestamp.defaultTimeFormat,
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
                dateFormat:Field.Timestamp.defaultDateFormat,
                onClose: function(dateText, inst) 
                {
                    $(this).datepicker("destroy");
                    $(this).attr("id",null);
                }
            }).datepicker("show");
        }
    });


    Field.Base.input_append(key, meta, context, new_element);
}


Field.Timestamp.get=function(key, meta, context)
{
    if (context.attr("field-allow-null")=="" && context.val()=="")
        return(null);

    //var dateStr=$(element).val().split()
    //var date=new Date($(element).datepicker("getDate"));
    //return($.datepicker.parseDate(defaultDateFormat+" "+defaultTimeFormat, $(element).val())/1000);
    //return(Date.parse()/1000);
    return(Date.parse(
            $.datepicker.parseDateTime(Field.Timestamp.defaultDateFormat, Field.Timestamp.defaultTimeFormat, context.val())
        )/1000);
}

Field.Timestamp.put=function(key, meta, context, data, options)
{
    var dateStr="";

    if (data!='')
    {
        var date=new Date(data*1000);
        dateStr=$.datepicker.formatDate( Field.Timestamp.defaultDateFormat, date );

        if (context.attr("field-timestamp-allow-time")!=null)
        {
            dateStr+=" "+$.datepicker.formatTime( Field.Timestamp.defaultTimeFormat, 
                    {
                        hour:   date.getHours(),
                        minute: date.getMinutes(),
                        second: date.getSeconds()
                    });
        }
    }

    if (context.hasClass("field-input"))
    {
        context.val(dateStr);
    }
    else
    {
        Field.Base.html_append(key, meta, context, data, options, dateStr);
    }
}






