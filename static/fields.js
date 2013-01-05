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

/*** put specified meta-datafield literally into context
 
    this is usually used to show the description of a field to the user, or things like min and max values.
    context should have class field-meta-put
    context should have an attribute called 'field-meta-key' that specfies the metadata key
*/
Field.Base.meta_put=function(key, meta, context)
{
    var meta_key=context.attr("field-meta-key");
    if (meta_key in meta)
        context.text(meta[meta_key]);
    else
        context.text("");
}

/*** appends specified input element into the context

    mostly used internally by input_create
    this will modify the input-element as well!
    automaticly sets field-key attribute.
    automaticly adds field-input-put class.
    when meta.readonly is not true, automaticly adds field-input-get class, otherwise disables input element.
    automacly sets title to meta.desc.
    */ 
Field.Base.input_append=function(key, meta, context, element)
{
    context.addClass("field-input-put");
    context.attr("field-key", key);
    context.attr("title", meta.desc);
    
    if (!meta.readonly)
    {
        context.addClass("field-input-get");
    }
    else
    {
        context.attr('disabled',true);
    }
    context.empty();
    context.append(element);
};


/*** create input element from metadata and store it in the context

    context should have class field-input-create
    newly created input elements automaticly get apporpiate classes and attributes. (see input_append)
    */
Field.Base.input_create=Field.Base.not_implemented;


/*** puts data into existing input element

    context should be a input element that was created by input_create
    context should have class field-input-put
    */
Field.Base.input_put=Field.Base.not_implemented;


/*** gets data from existing input element and returns it.
    context should be an input-field that was created by input_create 
    context should have class field-input-get
*/
Field.Base.input_get=Field.Base.not_implemented;


/*** stores specified element or string in context

    mostly used internally by html_create.
    if options.show_changes is true, then it highlights the field if it has gotten a different content.
    element can be a jquery object or a string. if its a string then context.text() will be used to
    set the element. otherwise the content will be emptied and the element will be added.

    */ 
Field.Base.html_append=function(key, meta, context, element, options)
{
    if (typeof element=='String')
    {
        if (element!=context.text())
        {
            context.text(element);
            if (options.show_changes)
                context.effect('highlight', 2000);
        }
    }
    else
    {
        if (element.text()!=context.text())
        {
            context.empty();
            context.append(element);
            if (options.show_changes)
                context.effect('highlight', 2000);
        }
    }
}


/*** convert data into html or plain text and store it in the context
    context should have class field-html-create    
*/
Field.Base.html_create=Field.Base.not_implemented;



/////////////////////////////////////////////////////////////////////////////////////////////
/*** Dictonary type. This is usually the base fieldtype we start with. (the "root" of the meta-data)
    This fieldtype is recursive, so its allowed for meta data to have Dicts in Dicts.
*/
Field.Dict=Object.create(Field.Base);


//a dict will traverse all the sub-metadata items
Field.Dict.input_create=function(key, meta, context)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);

        if (thismeta.type=='Dict')
        {
            Field.Dict.input_create(key_str, thismeta, context);
        }
        else
        {
            var selector='.field-input-create[field-key="'+key_str+'"]';

             //traverse the field-input-create elements for this key:
            $(selector, context).each(function()
            {
                Field[thismeta.type].input_create(key_str, thismeta, $(this));
            }); 
        }
    }); //meta data
};

//a dict will traverse all the sub-metadata items
Field.Dict.meta_put=function(key, meta, context)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);

        if (thismeta.type=='Dict')
        {
            Field.Dict.meta_put(key_str, thismeta, context);
        }

        var selector='.field-meta-put[field-key="'+key_str+'"]';
        //traverse the field-meta-put elements for this key:
        $(selector, context).each(function()
        {
            if (thismeta.type=='Dict')
                Field.Base.meta_put(key_str, thismeta, $(this));
            else
                Field[thismeta.type].meta_put(key_str, thismeta, $(this));
        }); 
    }); //meta data
};


Field.Dict.input_put=function(key, meta, context, data, options)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            Field.Dict.input_put(key_str, thismeta, context, data[sub_key], options);
        }
        else
        {
            var selector='.field-input-put[field-key="'+key_str+'"]';

            //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                console.log("dict.input_put subkey", sub_key, data[sub_key]);
                Field[thismeta.type].input_put(key_str, thismeta, $(this), data[sub_key], options);
            }); 
        }
    }); //meta data
};

Field.Dict.input_get=function(key, meta, context)
{
    var ret={};

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            ret[sub_key]=Field.Dict.input_get(key_str, thismeta, context);
        }
        else
        {
            var selector='.field-input-get[field-key="'+key_str+'"]';

            //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                ret[sub_key]=Field[thismeta.type].input_get(key_str, thismeta, $(this));
            }); 
        }
    }); //meta data

    return(ret);
};


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


/////////////////////////////////////////////////////////////////////////////////////////////
/**
 * List is a bit of a special case: 
 * The original element we call the 'source-element', it should have a field-list-source class. 
 * input_create will make sure of this.
 * 
 * When calling input_put, the source-element will be cloned, and input_put will be called recursively 
 * with this cloned item as context.
 *
 * Every cloned item gets the class field-list-item, but the other field-classes are removed. otherwise
 * the rest of the fieldfunctions would get confused about these clones.
 *
 * Add a field-list-source-hide the source element to hide it. (e.g. user doesnt see a dummy-item)
 * 
 * Use Field.List.Clone to correctly clone the source element.
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
    clone.removeClass("field-input-create field-input-get field-input-put field-meta-put field-html-create field-list-source field-list-source-hide");
    clone.addClass("field-list-item");
    return(clone);

}

Field.List.input_create=function(key, meta, context)
{
    context.addClass("field-list-source");

    if (!meta.readonly)
        context.addClass("field-input-get");

    context.addClass("field-input-put");
    //recurse into subdict, every list should have one
    Field.Dict.input_create(key, meta.meta, context);
};

/*
 options.list_update: update an existing list, instead off removing and recreating it. 
 usefull with options.show_changes, to give user feedback of changes.

 options.list_no_remove: dont remove existing items. usefull for endless scrolling.
*/

Field.List.input_put=function(key, meta, context, data, options)
{
    var parent=context.parent();
    var list_key=context.attr("field-list-key");

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
            var update_element={};
            
            //update mode
            if (options.list_update)
            {
                if (list_key)
                {
                    //try to find existing element
                    //the field-key and field-list-id should both match
                    update_element=$('.field-list-item[field-key="'+key+'"][field-list-id="'+item_value[list_key]+'"]', parent);
                }
                else
                {
                    //just use plain item_nr array adressing:
                    if (item_nr < existing_items.length)
                        update_element=existing_items[item_nr];
                }
            }
            
            //not found? clone new element
            if (!update_element.length)
            {
                //deep clone the prepared clone
                update_element=clone.clone(true);

                if (list_key)
                    update_element.attr("field-list-id", item_value[list_key]);

                //we append before we do other stuff with the element. This is because effects and stuff dont work otherwise.
                //NOTE: can we improve performance a lot by appending after the input_put on cloned items?
                update_element.insertBefore(context);
            }
            //found, make sure its not deleted
            else
            {
                if (options.list_update)
                    update_element.removeClass("field-list-delete");
            }
            
            //finally put data into it
            Field.Dict.input_put(key, meta.meta, update_element, item_value, options);
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

Field.List.input_get=function(key, meta, context)
{
    var value=new Array();
    var parent=$(context).parent();
    
    //traverse all the list items
    $('.field-list-item[field-key="'+key+'"]', parent).each(function(){
        value.push(Field.Dict.input_get(key, meta, $(this)));
    });
    return(value);    
}

/////////////////////////////////////////////////////////////////////////////////////////////
Field.String=Object.create(Field.Base);

Field.Password=Object.create(Field.String);

Field.Number=Object.create(Field.Base);

Field.Timestamp=Object.create(Field.Base);

Field.Bool=Object.create(Field.Base);

Field.Select=Object.create(Field.Base);

Field.MultiSelect=Object.create(Field.Base);


