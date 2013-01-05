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
    context.empty();
    context.append($("<span class='ui-state-error'>Not implemented: "+key));
    console.error("Not-implemented field-function called: ", key, meta, context, data);
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
        var selector='.field-input-create[field-key="'+key_str+'"]';

        //traverse the field-input-create elements for this key:
        $(selector, context).each(function()
        {
            Field[thismeta.type].input_create(key_str, thismeta, this);
        }); 
    }); //meta data
};

//a dict will traverse all the sub-metadata items
Field.Dict.meta_put=function(key, meta, context)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        var selector='.field-meta-put[field-key="'+key_str+'"]';
        //traverse the field-meta-put elements for this key:
        console.log('select', selector);
        $(selector, context).each(function()
        {
            console.log(this);
            Field[thismeta.type].meta_put(key_str, thismeta, this);
        }); 
    }); //meta data
};


//-options.update: set true to update existing data instead of cleaning it. (usefull for List)
Field.Dict.input_put=function(key, meta, context, data, options)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        var selector='.field-input-put[field-key="'+key_str+'"]';

        //traverse the field-meta-put elements for this key:
        $(selector, context).each(function()
        {
            Field[thismeta.type].input_put(key_str, thismeta, this, data[sub_key], options);
        }); 
    }); //meta data
};

Field.Dict.input_get=function(key, meta, context)
{
    var ret={};

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        var selector='.field-input-get[field-key="'+key_str+'"]';

        //traverse the field-meta-put elements for this key:
        $(selector, context).each(function()
        {
            ret[sub_key]=Field[thismeta.type].input_get(key_str, thismeta, this);
        }); 
    }); //meta data

    return(ret);
};


//-options.show_changes: highlight changed data 
Field.Dict.html_create=function(key, meta, context, data, options)
{
    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Dict.concat_keys(key, sub_key);
        
        var selector='.field-html-create[field-key="'+key_str+'"]';

        //traverse the field-input-create elements for this key:
        $(selector, context).each(function()
        {
            Field[thismeta.type].html_create(key_str, thismeta, this, options);
        });
    }); 

};

