/////////////////////////////////////////////////////////////////////////////////////////////

/*** All fieldtypes are stored in a dictorany so we can easily look them up.
*/
Field={};



/*** Fields base prototype
    Most publicly callable functions have these parameters:
        key         :key of the specified meta data. Usually also stored in context.attr("field-key")
        meta        :meta-data 
        context     :jquery dom element to operate on or in
        data        :data to put in
*/
Field.Base={};

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
    var meta_key=context.attr("field-meta-key")];
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
Field.Base.input_append=function(key, meta, context, input)
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
    context should be an input-field was created by input_create 
    context should have class field-input-get
*/
Field.Base.input_get=Field.Base.not_implemented;


/*** convert data into html and store it in the context
    context should have class field-html-create    
*/
Field.Base.html_create=Field.Base.not_implemented;
{

}




/////////////////////////////////////////////////////////////////////////////////////////////
/*** Dictonary type. This is usually the base fieldtype we start with.

*/
Field.Dict=Object.create(Field.Base);


Field.Dict.input_create=function(key, meta, context)
{

}

