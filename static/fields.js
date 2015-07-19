/////////////////////////////////////////////////////////////////////////////////////////////

/*** All fieldtypes are stored in a dictorany so we can easily look them up.

These are not real classes that are instantiated; instead its a bunch of static functions with are overloaded by
'subclasses' via prototyping. all the data is passed around as function parameters. (in contrast to controls.js)

There is a difference between keys and data_keys: A key refers to an element from a meta-array. A data-key refers to a element from a data-array.

Sometimes they are the same, but in the case of a List, the data-key will also include the array index or id.

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

//converts a dotted key string to a keys-array
// foo.0.bar becomes ["foo", "0", "bar"]
Field.Base.keys=function(key)
{
    return(key.split("."));
}

//convert a key-array to dotted notation string
Field.Base.key_str=function(keys)
{
    return(keys.join("."));
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
Field.Base.meta_put=function(key, meta, context, options)
{
//    console.log("meta_put", key, meta, context);
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
Field.Base.input_append=function(key, meta, context, element, options)
{
    element.addClass("field-input field-put");
    element.attr("field-key", key);
    element.attr("title", meta.desc);
    
    if (!meta.readonly && !options.readonly)
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
Field.Base.html_put=function(key, meta, context, data, options, element)
{
    //probably a jquery object
    // console.log("html_put", key , meta, context, data , options, element);
    if (element instanceof jQuery)
    {
        if (element.text()!=context.text())
        {
            context.empty();
            context.append(element);
            if (options.show_changes)
                this.highlight(context);
        }
        else
        {
            //element can still have different attributes:
            context.empty();
            context.append(element);
        }
    }
    else
    {
        if (element!=context.text())
        {
            context.text(element);
            if (options.show_changes)
                this.highlight(context);
        }
        else
        {
            //element can still have different attributes:
            context.text(element);
        }
    }

}

//give a visual temporary trigger to highlight a field. (used with options.show_changes)
Field.Base.highlight=function(element)
{
    element.stop(true,true).effect('highlight', 2000);
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




/**
 * Looks up an element in the current context by traversing the data_keys array.
 * these are usually dict keys and list keys.
 * array items are noted by a number.
 * example: [ "test", 5, "bla" ]
 * This selects the bla key in the 5th element of the test array.
 * This notation is also used by errors that are returned from the server.
 */
Field.Base.find_element=function(key, meta, context, data_keys)
{  
//        console.log("Field.Base.find_element found element: ", key, meta, context, data_keys);
        //the interesting stuff happens in Field.Dict and Field.List
        //when we reach Field.Base, it means we've reached 'the end' 
        //(we cant search any deeper, even if we still have keys left)
        return(context);

}

/** 
 * Return a reference to the meta-data by finding the keys 
 *
 *
*/
Field.Base.resolve_meta=function(meta, keys)
{
    //reached base, we cant resolve and furhter submeta data
    return(meta);

}

/** 
 * Determines the data-key-array of the specified element.
 *
 * The first time you call it you have to specify keys by using Field.Base.keys on the field-key of the element.
 *
 * Meta is always the full-meta data from the "root". keys starts at the deepest level and traverses up.
 */

/* XXX dit werkt niet...een field.list heeft niet de volledige meta vanaf root die nodig is.
 opnieuw implementeren door gewoon dom traversal te doen en field-list-id te adden.
 eventueel field-list-id renamen naar field-id?

Field.Base.find_data_keys=function(keys, meta, element)
{
    console.log("field.base.find_data_keys", keys, meta);
    var this_key=keys.pop();

    var data_keys=[this_key];

    //do we have any more keys left?
    if (keys.length!=0)
    {
        //resolve the metadata of the parent
        var this_meta=Field[meta.type].resolve_meta(meta, keys);
        console.log("field.base.find_data_keys this meta", meta, keys, this_meta);

        //call the find_keys function of the parents datatype
        var parent_keys=Field[this_meta['type']].find_data_keys(keys, meta, element);

        //append our data_keys to the parent_keys
        data_keys=parent_keys.concat(data_keys);
    }

    return(data_keys);

}
*/
Field.Base.from_element_get_data_keys=function(element)
{
    if (!element.attr("field-key"))
        return("");

    var meta_keys=Field.Base.keys(element.attr("field-key"));
    var data_keys=[];

    while(meta_keys.length>0)
    {
        //NOTE: this seems hackish since its list-stuff. maybe change name to a more generic id?
        if (element.attr("field-list-id"))
            data_keys.unshift(element.attr("field-list-id"));

        data_keys.unshift(meta_keys.pop());

        //find next parent element
        element=element.closest('[field-key="'+Field.Base.key_str(meta_keys)+'"]');

        //in case of relations
        if (element.hasClass("field-key-root"))
            break;
    }   
    return (Field.Base.key_str(data_keys));
}

/////////////////////////////////////////////////////////////////////////////////////////////
/*** Dictonary type. This is usually the base fieldtype we start with. (the "root" of the meta-data)
    This fieldtype is recursive, so its allowed for meta data to have Dicts in Dicts.

    Note that Dict is the only field-type where the context-parameter doesnt actually point directly to a field element,
    but rather points to a dom element that contains children which are fields.

*/
Field.Dict=Object.create(Field.Base);


//a dict will traverse all the sub-metadata items
Field.Dict.meta_put=function(key, meta, context, options)
{
    //dict operates on a bigger context, but meta_put is expecting direct element, so give it that:
//    if (key)
    {
        var selector='.field-meta-put[field-key="'+key+'"]';
        $(selector, context).each(function()
        {               
            Field.Base.meta_put(key, meta, $(this), options);
        });
    }

    var recursive_options={};
    $.extend(recursive_options, options);
    if (meta.readonly)
        recursive_options.readonly=true;

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Base.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            //handle sub-dicts in the same context. this way you can use keys
            //like foo.subdict, without needing a surrounding element that has key foo.
            Field.Dict.meta_put(key_str, thismeta, context, recursive_options);
        }
        else
        {
            var selector='.field-meta-put[field-key="'+key_str+'"]';
             //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                if (thismeta.type in Field)
                    Field[thismeta.type].meta_put(key_str, thismeta, $(this), recursive_options);
            });
        }
    }); //meta data
};


//-options.show_changes: highlight changed data 
//if the context has the class field-dict-raw, then also the raw data is stored in the field-data data-attribute.
Field.Dict.put=function(key, meta, context, data, options)
{
    //also store raw input?
    //its important to check field-key, since recursing into a subdict will keep the same context. this would overwrite our data.
    if (context.hasClass("field-dict-raw") && key==context.attr("field-key"))
    {
        // console.error("putting it", data,context[0]);
        context.data("field-data",data);
    }

    //traverse the data
    //NOT the metadata, because we want to keep default values that are already set
    $.each(data, function(sub_key, thisdata){
        var key_str=Field.Base.concat_keys(key, sub_key);
//        var thisdata=data[sub_key];
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

                //traverse the field-put elements for this key:
                $(selector, context).each(function()
                {
                    if (thismeta.type in Field)
                        Field[thismeta.type].put(key_str, thismeta, $(this), thisdata, options);
                });
            }
        }
    }); // data
};

Field.Dict.get=function(key, meta, context)
{
    var ret={};

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Base.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            //in case of a dict we keep the same context
            var sub_ret=Field.Dict.get(key_str, thismeta, context);
            if (Object.keys(sub_ret).length>0)
                ret[sub_key]=sub_ret;
        }
        else
        {
            var selector='.field-get[field-key="'+key_str+'"]';

            //traverse the field-get elements for this key:
            $(selector, context).each(function()
            {
                ret[sub_key]=Field[thismeta.type].get(key_str, thismeta, $(this));
            }); 
        }
    }); //meta data

    return(ret);
};

Field.Dict.find_element=function(key, meta, context, data_keys)
{
    // console.log("Dict.find_element", key, meta, context, data_keys);

    var this_key=data_keys[0];
    var sub_keys=data_keys.slice(1);
    var sub_meta=meta.meta[this_key];

    var key_str=Field.Base.concat_keys(key, this_key);

    //non existing key
    if (sub_meta==undefined)
    {
        if (sub_keys.length==0)
            return(context);

        //ignore non-existing keys. this happens due to relations. 
        return(Field.Dict.find_element(key_str, meta, context, sub_keys ));
    }

    var selector='.field-put[field-key="'+key_str+'"]';
    var sub_context=$(selector, context);


    //if the selector is not found, just keep looking in the same context for the next one
    if (sub_context.length==0)
        sub_context=context;

    //recurse into substuff
    return(Field[sub_meta.type].find_element(key_str, sub_meta, sub_context, sub_keys ));
}


Field.Dict.resolve_meta=function(meta, keys)
{
    if (keys.length==0)
        return(meta);

    var this_key=keys[0];

    if (this_key in meta.meta)
    {
        var sub_meta=meta.meta[this_key];
        var sub_keys=keys.slice(1);
        return(Field[sub_meta.type].resolve_meta(sub_meta, sub_keys));
    }
    else
    {
        return(meta);
    }
}


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
 * Use Field.List.clone to correctly clone a source element.
 * 
 * When the data is put, the field-list-id attribute of every cloned list item is set to the value of field
 * that is specified in meta.list_key
 */
Field.List=Object.create(Field.Base);

// correctly clones the specified field-list-source and resturns it
// source should be a jquery object
Field.List.clone=function(source_element)
{
    var clone=source_element.clone(true, true);
    clone.removeClass("field-input-create field-get field-put field-meta-put field-list-source field-list-source-hide");
    clone.addClass("field-list-item");
    return(clone);

}

Field.List.meta_put=function(key, meta, context, options)
{
//    console.log("list metaput", key, meta, context);
    if (Field.Base.meta_put(key, meta, context))
        return;

    //NO?
    // //fill all other metadata with the same key within this context (usefull for headers and stuff)
    // var selector='.field-meta-put[field-key="'+key+'"]';
    // $(selector, context).each(function()
    // {   
    //     console.error("putting meta", meta, this);            
    //     Field.Base.meta_put(key, meta, $(this));
    // });

    var list_source;
    if (context.hasClass("field-list-source"))
        list_source=context;
    else
        list_source=$(".field-list-source:first",context);


    //only listsources can get these:
    if (list_source)
    {
        if (!meta.readonly)
            list_source.addClass("field-get");

        list_source.addClass("field-put field-input");
    }

    //recurse into submeta
    var recursive_options={};
    $.extend(recursive_options, options);
    if (meta.readonly)
        recursive_options.readonly=true;
    Field[meta.meta.type].meta_put(key, meta.meta, context, recursive_options);

    //after the submeta data is done, attach event handlers for listsources
    if (list_source)
    {
        if (!recursive_options.readonly)
        {
            //create an add-handler to add items to lists
            list_source.parent().off("click", ".field-list-on-click-add").on("click", ".field-list-on-click-add", function(){
                Field.List.from_element_add(null, this);
                context.trigger("field_added",[key , meta, context]);
                Field.List.show_hide_on_empty(key, meta, list_source.parent());
            });
            
            //create an add-handler if the source-element of a list is focussed
            list_source.parent().off("focus", ".field-list-on-focus-add :input").on("focus", ".field-list-on-focus-add :input", function(){
                //only add an item if the user focusses a field in the listsource..
                //console.error(from_element_get(null, $(this)));
                if (Field.List.from_element_get(null, $(this)).hasClass("field-list-source"))
                {
                    //most reliable way to move the focus to the correct field, since it also should work with relations (which uses different classes on its input box)
                    $(this).addClass("field-list-tmp-focus");
                    var added_item=Field.List.from_element_add(null, this);
                    $(this).removeClass("field-list-tmp-focus");
                    $(".field-list-tmp-focus", added_item).focus().removeClass("field-list-tmp-focus");
                    //indicates that a field was added manually by the user
                    context.trigger("field_added",[key , meta, context]);
                    Field.List.show_hide_on_empty(key, meta, added_item.parent());
                    return(false);
                }
                return(true);
            });
            
            //create a handler to delete a list item
            list_source.parent().off("click", ".field-list-on-click-del").on("click", ".field-list-on-click-del", function(){
                var clicked_element=Field.List.from_element_get(null, this);
                if (clicked_element.hasClass("field-list-item"))
                {
                    var parent=clicked_element.parent();
                    clicked_element.remove();
                    //indicates that a field was deleted manually by the user
                    context.trigger("field_deleted",[key , meta, context]);
                    Field.List.show_hide_on_empty(key, meta, parent);

                }
            });
            
            //create handlers to make lists sortable
            if (list_source.hasClass("field-list-sortable"))
            {
                list_source.parent().sortable({
                    placeholder: "",
                    handle: ".field-list-on-drag-sort",
                    cancel: ".field-list-source",
                    items:"> .field-list-item",
                    forceHelperSize: true,
                    forcePlaceholderSize: true
                });
            };

            //the view that was opened by us has changed something to our item
            //NOTE:this might do things twice, since there is also a global change-handler in things like controllist.
            //the reason we do it here as well is that fields normally dont know (and shouldnt know) there model-class and cant thus cant listen to global change events. only field.relation is an exception offcourse.
            $(list_source.parent()).off("control_form_changed control_form_created").on("control_form_changed control_form_created",function(event,result)
            {
                console.log("field.list: view opened by us has changed the data", result, this);

                Field.List.put(
                    key,
                    meta,
                    list_source,
                    [ result.data ],
                    {
                        list_no_remove: true,
                        list_update: true,
                        show_changes: true

                    }
                );

                return(false);
            });

            //the view that was opened by us has deleted our item
            $(list_source).off("control_form_deleted").on("control_form_deleted",function(event)
            {
                console.log("view opened by us has deleted the data");
                 $(this).hide(1000,function()
                 {
                    var parent=$(this).parent();
                    $(this).remove();
                    Field.List.show_hide_on_empty(key, meta, parent);
                 });
                return(false);
            });
        }
        

        //create handler to open a view to edit the clicked element, or create a new element (in case the user clicked the field-list-source)
        $(list_source.parent()).off("click",".field-list-on-click-view").on("click",".field-list-on-click-view",  function(event)
        {
            if (meta.list_key==undefined)
            {
                console.error("Cant view list item, since there is no list_key defined in the metadata",this );
                return(true);
            }

            var list_id=Field.List.from_element_get_id(list_source.attr("field-key"), this);
            var element=$(this);
        
            //create the view to edit the clicked item
            var editView={};
            editView.params={};
            editView.focus=Field.Base.from_element_get_data_keys(element);
            //console.log(editView.focus);return(false);
            editView.params[meta.list_key]=list_id;

            //extend the view params with data stored in the element and list_source            
            $.extend(true, editView.params, list_source.data("field-list-view-params"));
            $.extend(true, editView.params, element.data("field-list-view-params"));


            editView.x=event.clientX;
            editView.y=event.clientY;
            if (element.attr("field-list-view"))
            {
                editView.name=element.attr("field-list-view");
                editView.mode=element.attr("field-list-view-mode");
            }
            else
            {
                editView.name=list_source.attr("field-list-view");
                editView.mode=list_source.attr("field-list-view-mode");                
            }
            if (!editView.mode)
                editView.mode="main";
     
            viewCreate(
                {
                    creator: element
                },
                editView);

            return(false);
        });



    }

};

// show and hide certain items, depending on the emptyness of the list
//parent is the container that contains the listitems 
Field.List.show_hide_on_empty=function(key, meta, parent)
{

    var show_on_empty=$('.field-list-show-on-empty[field-key="'+key+'"]', parent);
    var hide_on_empty=$('.field-list-hide-on-empty[field-key="'+key+'"]', parent);
    if (show_on_empty.length || hide_on_empty.length)
    {
        var existing_items=$('.field-list-item[field-key="'+key+'"]', parent);
        if (existing_items.length)
        {
            show_on_empty.hide();
            hide_on_empty.show();
        }
        else
        {
            show_on_empty.show();
            hide_on_empty.hide();
        }
    }
}

/*
 options.list_update: update an existing list, instead off removing and recreating it. 
 usefull with options.show_changes, to give user feedback of changes, or with endless scrolling.

 options.list_no_remove: dont remove existing items. usefull for endless scrolling.

 options.list_no_add: dont add new items. only update existing items.

 options.list_continue: add new items to the end of the list, instead of being intelligent. used with list_update for endless scrolling

 NOTE: no_remove and no_add are usually used when the data is incomplete. e.g. the data is just the one item that changed.
*/

Field.List.put=function(key, meta, context, data, options)
{
//    console.log("Field.List.put: ", key ,meta, context, data, options);

    //we dont want all the list-specific options to recurse, since there might be sublists or sub-relationlists that get confused.
    var recursive_options={};
    $.extend(recursive_options, options);
    //since sublists get complete data, we dont want the no_add and no_delete options there:
    delete recursive_options.list_no_add;
    delete recursive_options.list_no_remove;
    delete recursive_options.list_continue;

    var parent=context.parent();

    //existing list items (if any)
    var existing_items=$('.field-list-item[field-key="'+key+'"]', parent);
    
    //not in update mode
    if (!options.list_update)
    {
        //remove existing listitems
        if (!options.list_no_remove)
        {
            existing_items.remove();
            existing_items=$();
        }

    }
    //in update mode, add a marker to remember which stuff can be deleted
    else
    {
        //remove missing items
        if (!options.list_no_remove)
            existing_items.addClass("field-list-delete");
    }
    
    //for performance, prepare a listitem one time and clone that.
    var clone=Field.List.clone(context);
    
    //traverse all the new list items
    if (data)
    {
        var prev_element=undefined;

        $.each(data, function (item_nr, item_value) {
            
            //this will become a new or existing item that needs to be filled with data
            var update_element=undefined;
            
            //update mode
            if (options.list_update)
            {
                //try to find existing element
                if (meta.list_key)
                {
                    //the field-key and field-list-id should both match
                    update_element=$('.field-list-item[field-key="'+key+'"][field-list-id="'+item_value[meta.list_key]+'"]', parent);
                }
                else
                {
                    update_element=$('.field-list-item[field-key="'+key+'"]', parent).eq(item_nr);
                }
                if (update_element.length==0)
                    update_element=undefined;
            }
            
            //not found? clone new element
            if (update_element==undefined)
            {
                //we dont want to add new items
                if (options.list_no_add)
                    return (true); //continue with next item ($.each)

                //deep clone the prepared clone
                update_element=clone.clone(true);

                if (meta.list_key)
                    update_element.attr("field-list-id", item_value[meta.list_key]);
                else
                    update_element.attr("field-list-id", item_nr);


                //we append before we do other stuff with the element. This is because effects and stuff dont work otherwise.
                //NOTE: can we improve performance a lot by appending after the put on cloned items?
                if (prev_element)
                {
                    //keep the right order if we're adding new items when updating an existing list:
                    update_element.insertAfter(prev_element);
                }
                else
                {
                    // console.log("no prevelement", options, existing_items.length);
                    //only insert before context if:
                    //-there are no existing items
                    //-we are in continue-mode (endless scroll)
                    if (  options.list_continue || existing_items.length==0)
                    {
                        // console.error("inserting before listsource");
                        update_element.insertBefore(context);
                    }
                    else
                    {
                        //we update a list and the first item in data seems to be new, so assume it should be the first in the list

                        // console.error("inserting before", existing_items[0]);
                        
                        //NOTE: we add first new items to the beginning of the list, since this is more intuitive for users. 
                        //especially with infinite scroll
                        update_element.insertBefore(existing_items[0]);
                        //update_element.insertBefore(context);
                    }
                }
            }
            //found, make sure its not deleted
            else
            {
                if (options.list_update)
                    update_element.removeClass("field-list-delete");
            }
            
            //finally put data into it
            Field[meta.meta.type].put(key, meta.meta, update_element, item_value, recursive_options);
            $(context).trigger("field_list_post_put", [ update_element, item_value ]);

            prev_element=update_element;
        });
    }
    
    //delete stuff that still has the delete-marker in it:
    if (options.list_update)
    {
        if (!options.list_no_remove)
        {
            if (options.show_changes)
            {
                $('.field-list-delete[field-key="'+key+'"]', parent).removeClass("field-list-item").hide(1000, function()
                        {
                            $(this).remove();
                        });
            }
            else
            {
                $('.field-list-delete[field-key="'+key+'"]', parent).remove();
            }
        }
    }

    Field.List.show_hide_on_empty(key, meta, parent);

}

Field.List.get=function(key, meta, context)
{
    // console.log("Field.List.get", key, meta, context);

    var values=new Array();
    var parent=context.parent();
    
    //traverse all the list items
    $('.field-list-item[field-key="'+key+'"]', parent).each(function(){
        // console.log("Field.List.get item", this);
        var value=Field[meta.meta.type].get(key, meta.meta, $(this));
        if (meta.list_key)
        {
            //TODO: store raw data in elements so that get also works nicely on other fields than field-input
            value[meta.list_key]=$(this).attr("field-list-id");
        }

        values.push(value);
    });
    return(values);    
}

/*** Gets a reference to the list-item-element, by resolving the specified element.

  if key is not null, it will only match list-items which this key. otherwise it will just get the closest one.


*/
Field.List.from_element_get=function(key, element)
{
    if (key!=null)
        return($(element).closest('.field-list-item[field-key="'+key+'"], .field-list-source[field-key="'+key+'"]'));
    else
        return($(element).closest('.field-list-item, .field-list-source'));

}


/*** Returns the id from the list item that holds the clicked element

  
If the listitem has a field-list-id, it returns that.

Otherwise it returns the index number. (array based indexing)

Returns undefined if the element somehow doesnt exist in the list, or the list is empty and only has a list-source item

*/
Field.List.from_element_get_id=function(key, element)
{
    list_element=Field.List.from_element_get(key, element);

    if (list_element.attr("field-list-id")!=null)
    {
        return (list_element.attr("field-list-id"));
    }
    else
    {
        //array based indexing:
        //traverse all the parent field-list-items and count them until we find the list_element:
        var list_element_index=undefined;
        list_element.parent().children('.field-list-item[field-key="'+list_element.attr("field-key")+'"]').each(function(index, list_item)
        {
            if (list_item===list_element[0])
            {
                list_element_index=index;
                return(false); //exit the .each()...
            }
        });
        return(list_element_index);
    }
}

/***  Adds a new list item, by resolving the list that belongs to the specfied element.

It will always make sure the field-list-source stays at the end of the list.

Also returns a reference to the new item.
*/
Field.List.from_element_add=function(key, element)
{
    var list_item=Field.List.from_element_get(key, element);

    if (list_item.length==0)
        return;

    var source_item=list_item.parent().children(".field-list-source");

    var add_item=Field.List.clone(source_item);

    if (list_item.hasClass("field-list-source"))
        add_item.insertBefore(list_item);
    else
        add_item.insertAfter(list_item);

    return(add_item);
};

/** a Field.List expects a 'list item id' in data_keys[0], which will then be looked up and recursed up on..

*/
Field.List.find_element=function(key, meta, context, data_keys)
{
    // console.log("Field.List.find_element", key, meta, context, data_keys);

    var list_item_id=data_keys[0];
    var sub_keys=data_keys.slice(1);
    var sub_meta=meta.meta; //(usually a dict)
    var list_context=context.parent();

    // console.log("key", key);
    // console.log("list_item_id", list_item_id);
    // console.log("sub_keys", sub_keys);
    // console.log("sub_meta", sub_meta);



    var selector='.field-list-item[field-key="'+key+'"]';
    var sub_context;

    if (meta.list_key)        
        sub_context=$(selector+'[field-list-id="'+list_item_id+'"]', list_context);
    else
        sub_context=$(selector, list_context).eq(list_item_id);


    //no more keys left?
    if (sub_keys.length==0)
        return(sub_context);


    //if the listitem is not found, just give it up and return an empty jquery result
    if (sub_context.length==0)
        return(sub_context);


    //recurse into substuff
    return(Field[sub_meta.type].find_element(key, sub_meta, sub_context, sub_keys ));
}


/** 
 * Determines the data-key-array of the specified element.
 *
 * This one is for the special case of the List-type. Usually you call Field.Base.
 *
 */
// Field.List.find_data_keys=function(keys, meta, element)
// {
//     //determine the list_id of the specified element:
//     var key_str=Field.Base.key_str(keys);
//     console.log("list keystr", keys, key_str);
//     var list_id=Field.List.from_element_get_id(key_str, element);
//     var data_keys=[list_id];

//     //let the base class handle the rest
//     var parent_keys=Field.Base.find_data_keys(keys, meta, element);

//     //append our list_id to the parent_keys and return that
//     console.log("concatting", parent_keys ,"en", data_keys);
//     data_keys=parent_keys.concat(data_keys);

//     return(data_keys);

// }

Field.List.resolve_meta=function(meta, keys)
{
    if (keys.length==0)
        return(meta);
//    console.error("resolve in list", meta, keys)f;
    return(Field[meta.meta.type].resolve_meta(meta.meta, keys));
}




/////////////////////////////////////////////////////////////////////////////////////////////
Field.String=Object.create(Field.Base);

Field.String.attach_eventhandlers=function(key,meta,context,new_element)
{
    //send changes as nice event with 'this' set to context
    $(new_element).on('input change', function()
    {
        context.trigger("field_changed",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
        return(false);
    });

    //send a field_done when the user seems to be done editting this field
    $(new_element).on('focusout keypress' , function(e)
    {
        if (e.keyCode!=undefined && e.keyCode!=$.ui.keyCode.ENTER)
            return(true);

        new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
    });

}


Field.String.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    var new_element;
    if (context.attr("rows"))
    {
        new_element=$("<textarea>").attr("rows", context.attr("rows")).attr("cols", context.attr("cols"));
    }
    else
    {
        new_element=$("<input>")
            .attr("type","text")
            .attr("size",meta.size);                       
    }

    new_element.val(meta.default);

    Field.Base.input_append(key, meta, context, new_element, options);

    this.attach_eventhandlers(key, meta, context, new_element);


}


Field.String.get=function(key, meta, context)
{
    var val=context.val();

    if (context.attr("field-allow-null")=="" && val=="")
                return (null);

    return (val);
}

Field.String.put=function(key, meta, context, data, options)
{
//    console.log("String.put", key , meta, context, data, options);
    if (context.hasClass("field-input"))
    {
        if (!options.no_input)
        {
            if (options.show_changes)
            {
                if (context.val()!=data)
                    this.highlight(context);
            }

            context.val(data);
        }
    }
    else
    {
        // context.addClass("notranslate");
        if (data==null)
            Field.Base.html_put(key, meta, context, data, options, "");
        else
            Field.Base.html_put(key, meta, context, data, options, data);
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////
Field.File=Object.create(Field.Base);

Field.File.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    var new_element;
    new_element=$("<input>")
        .attr("type","file");

    Field.Base.input_append(key, meta, context, new_element, options);

}


Field.File.get=function(key, meta, context)
{
    //return fileobject (which will be uploaded out-of-band by rpc.py)
    return($(context)[0].files[0])

}

Field.File.put=function(key, meta, context, data, options)
{
//    console.log("String.put", key , meta, context, data, options);
    if (context.hasClass("field-input"))
    {
        if (!options.no_input)
            context.val(data);
    }
    else
    {
        // context.addClass("notranslate");

        if (data==null)
            Field.Base.html_put(key, meta, context, data, options, "");
        else
            Field.Base.html_put(key, meta, context, data, options, data);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////
Field.Image=Object.create(Field.Base);

Field.Image.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    var new_element;
    new_element=$("<image>")

    Field.Base.input_append(key, meta, context, new_element, options);

}


Field.Image.get=function(key, meta, context)
{
  
}

Field.Image.put=function(key, meta, context, data, options)
{
    if (options.show_changes)
    {
        if (context.attr("src")!=data)
            this.highlight(context);
    }

    context.attr("src", data);


}



/////////////////////////////////////////////////////////////////////////////////////////////
//Password is almost the same as String
Field.Password=Object.create(Field.String);

Field.Password.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    var new_element;
        new_element=$("<input>")
            .attr("type","password"); 

    new_element.val(meta.default);

    Field.Base.input_append(key, meta, context, new_element, options);

    this.attach_eventhandlers(key, meta, context, new_element);

}


/////////////////////////////////////////////////////////////////////////////////////////////

Field.Number=Object.create(Field.String);
Field.Number.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    var new_element;
    new_element=$("<input>")
        .attr("type","text")
        .attr("size", meta.size);   

    new_element.val(meta.default);

    Field.Base.input_append(key, meta, context, new_element, options);

    this.attach_eventhandlers(key, meta, context, new_element);
}



Field.Number.get=function(key, meta, context)
{
    var val=context.val();
    if (val=="")
        return(null)
    else if (Number(val)!=val)
        return val;
    else
        return(Number(val));

}


///////////////////////////////////////////////////
Field.Select=Object.create(Field.Base);
Field.Select.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
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
    $.each(meta['choices'], function(choicenr, choice){
        var option_element=$("<option>")
            .attr("value",choicenr)
            .text(choice[1]);

        if (choice[0]==null)
            option_element.prop('disabled',true);
        
        //we use this instead of new_element.val(thismeta.default) because clone wont work with this.
        if (choice[0]==meta.default &&  !allow_null)
            option_element.attr("selected","selected");
        new_element.append(option_element);
    });
            
    Field.Base.input_append(key, meta, context, new_element, options);

    //send changes as nice event with 'this' set to context
    $(new_element).on('change', function()
    {
        context.trigger("field_changed", [key , meta, context, Field[meta.type].get(key,meta,$(this)) ] );
        new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
        return(false);
    });

    $(new_element).on('focusout', function()
    {
        new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
        return(false);
    });

}


Field.Select.get=function(key, meta, context)
{

    if (context.attr("field-allow-null")=="" && context.prop("selectedIndex")==0)
        return (null);

    //translate selected index to value
    return(meta.choices[context.val()][0]);
}

Field.Select.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
    {
        if (!options.no_input)
        {
            //translate raw data to index
            for (i in meta.choices)
            {
                if (meta.choices[i][0]==data)
                {
                    if (options.show_changes)
                    {
                        if (context.val()!=data)
                            this.highlight(context);
                    }

                    context.val(i);
                    break;
                }
            }
        }
    }
    else
    {
        var new_element=$("<span>");
        new_element.addClass("field-select-"+data);
        // new_element.addClass("field-select-"+key+"-"+data);

        //translate raw data to descriptive text
        for (i in meta.choices)
        {
            if (meta.choices[i][0]==data)
            {
                new_element.text(meta.choices[i][1]);
                break;
            }
        }

        Field.Base.html_put(key, meta, context, data, options, new_element);
    }
}



///////////////////////////////////////////////////
Field.Bool=Object.create(Field.Base);
Field.Bool.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
        return;

    if (context.attr("field-allow-null")=="")
    {
        //if we allow null, we use a select box for it
        var select_meta={};
        $.extend(select_meta, meta);
        select_meta.type='Select';
        select_meta.choices=[
                        [false,meta.false_desc],
                        [true,meta.true_desc]
                    ];
        Field.Select.meta_put(key,select_meta,context, options);
    }
    else
    {
        var new_element=$("<input>")
            .attr("type","checkbox")
            .attr("value","")
        new_element.attr("checked", meta.default);
        Field.Base.input_append(key, meta, context, new_element, options);

        //send changes as nice event with 'this' set to context
        $(new_element).on('change', function()
        {
            new_element.trigger("field_changed", [ key , meta, context, Field[meta.type].get(key,meta,$(this)) ] );
            new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
            return(false);
        });

    }


}


Field.Bool.get=function(key, meta, context)
{

    if (context.attr("field-allow-null")=="")
    {
        //if we allow null, we used a select box for it
        return(Field.Select.get(key ,meta, context));
    }
    else
    {
        if (context.attr("checked"))
            return(true);
        else
            return(false);
    }
}

//specify options.field_action to invert value and emit a field_done.
Field.Bool.put=function(key, meta, context, data, options)
{
    if (context.hasClass("field-input"))
    {
        if (!options.no_input)
        {
            if (context.attr("field-allow-null")=="")
            {
                //if we allow null, we use a select box for it
                Field.Select.put(key, meta, context, data, options);
            }
            else
            {
                if (options.field_action)
                {
                    //invert choice and say we're done (used for edit-in-place)
                   context.attr("checked", !data);
                   context.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
                }
                else
                {
                    if (options.show_changes)
                    {
                        if (context.attr("checked")!=data)
                            this.highlight(context);
                    }

                    context.attr("checked", data);
                }
            }
        }
    }
    else
    {
        var new_element=$("<span>");
        

        if (data)
        {
            new_element.addClass("field-bool-true");
            new_element.removeClass("field-bool-false");
            // new_element.addClass("field-bool-"+key.replace(".","_")+"-true");
            // new_element.removeClass("field-bool-"+key.replace(".","_")+"-false");

            if (context.attr("field-no-text")==undefined)
                new_element.text(meta.true_desc);
        }
        else
        {
            new_element.addClass("field-bool-false");
            new_element.removeClass("field-bool-true");
            // new_element.addClass("field-bool-"+key.replace(".","_")+"-false");
            if (context.attr("field-no-text")==undefined)
                new_element.text(meta.false_desc);
        }

        Field.Base.html_put(key, meta, context, data, options, new_element);
    }
}



///////////////////////////////////////////////////
Field.MultiSelect=Object.create(Field.Base);
Field.MultiSelect.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
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

        label.prepend(checkbox);
        new_element.append(label);
                
        //add break
        //TODO: do this with css via a field-multiselect-bla class or something?
        new_element.append($("<br>"));
    });

    Field.Base.input_append(key, meta, context, new_element, options);

    //send changes as nice event with 'this' set to context
    $(new_element).on('change', function()
    {
        new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
        context.trigger("field_changed",[ key, meta, context, Field[meta.type].get(key,meta, new_element) ]); 
        return(false);
    });

    //send a field_done when the user seems to be done editting this field
    // $(new_element).on('focusout', function()
    // {
    //     new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
    //     return(false);
    // });

}


Field.MultiSelect.get=function(key, meta, context)
{
    var value=[];
    
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
    if (data==null)
        return;
    
    if (context.hasClass("field-input"))
    {
        if (!options.no_input)
        {
            $("input", context).each(function()
            {
                //set checked to true if the value of the checkbox is found in the value passed to this function:
                var checked=(data.indexOf($(this).attr("value")) != -1)
                if (options.show_changes)
                {
                    if ($(this).attr("checked")!=checked)
                        Field.Base.highlight($(this));
                }
                $(this).attr("checked", checked);
            });
        }
    }
    else
    {
        var new_element=$("<span>");
        
        for(data_nr in data)
        {
            new_element.append(
                $("<div>") 
                    .addClass("field-multiselect")
                    .addClass("field-multiselect-"+data[data_nr])
                    // .addClass("field-multiselect-"+key+"-"+data[data_nr])
                    .text(meta.choices[data[data_nr]])
            );
        }

        Field.Base.html_put(key, meta, context, data, options, new_element);
    }
}


/////////////////////////////////////////////////////////////////////////
Field.Timestamp=Object.create(Field.Base);

Field.Timestamp.defaultDateFormat='dd M yy';
Field.Timestamp.quickDateFormat='D dd M';
Field.Timestamp.defaultTimeFormat='HH:mm';

Field.Timestamp.meta_put=function(key, meta, context, options)
{
    if (Field.Base.meta_put(key, meta, context, options))
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
    new_element.on('focus click', function(){
        //we probably never want to activate inside of a list-source
        if ($(this).closest(".field-list-source").length != 0)
            return(true);

        if ($(this).hasClass("hasDatepicker"))
            return(true);
        
        var widget;
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
                    new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,new_element) ]);

                }
            }).datetimepicker("show");

            widget=$(this).datetimepicker("widget");
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
                    new_element.trigger("field_done",[key , meta, context, Field[meta.type].get(key,meta,$(this)) ]);
                }
            }).datepicker("show");

            widget=$(this).datepicker("widget");
        }

        var picker=$(this);
        function quickdate(format, timestamp)
        {
            var date=new Date(timestamp);
            var new_element=$("<div class='field-timestamp-quick'>"+format.replace("%",$.datepicker.formatDate( Field.Timestamp.quickDateFormat, date ))+"</div>");
            widget.append(new_element);
            new_element.click(function(){
                picker.datepicker("setDate", date );
                picker.datepicker("hide");
                return(false);
            })
        }

        var now=new Date().getTime();
        quickdate("% (Today)", now);
        quickdate("% (Tomorrow)", now + 1*1000*3600*24);
        quickdate("%", now + 2*1000*3600*24);
        quickdate("%", now + 3*1000*3600*24);
        quickdate("%", now + 4*1000*3600*24);
        quickdate("%", now + 5*1000*3600*24);
        quickdate("%", now + 6*1000*3600*24);
        widget.append("<br>");
        quickdate("in 1 week (%)", now + 7*1000*3600*24);
        quickdate("in 1 month (%)", now + 30*1000*3600*24);
        quickdate("in 1 year (%)", now + 365*1000*3600*24);
        widget.append("<br>");

        var nodate=$("<div class='field-timestamp-quick'>no date</div>");
        widget.append(nodate)
        nodate.click(function(){
            new_element.val("");
            picker.datepicker("hide");
            return(false);
        });

        return(false);
    });


    Field.Base.input_append(key, meta, context, new_element, options);

    //send changes as nice event with 'this' set to context
    $(new_element).on('input change', function(e)
    {
        context.trigger("field_changed",[ key, meta, context, Field[meta.type].get(key,meta,$(this)) ] );
        return(false);
    });

}


Field.Timestamp.get=function(key, meta, context)
{
    if (context.val()=="")
    {
        return(null);
    }
    //var dateStr=$(element).val().split()
    //var date=new Date($(element).datepicker("getDate"));
    //return($.datepicker.parseDate(defaultDateFormat+" "+defaultTimeFormat, $(element).val())/1000);
    //return(Date.parse()/1000);
    if (context.attr("field-timestamp-allow-time")!=null)
    {
        return(Date.parse(
                $.datepicker.parseDateTime(Field.Timestamp.defaultDateFormat, Field.Timestamp.defaultTimeFormat, context.val())
            )/1000);

    }
    else
    {
        return(Date.parse(
                $.datepicker.parseDate(Field.Timestamp.defaultDateFormat, context.val())
            )/1000);
    }
}

Field.Timestamp.put=function(key, meta, context, data, options)
{
    var dateStr="";

    if (data)
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
        if (!options.no_input)
        {
            if (options.show_changes)
            {
                if (context.val()!=dateStr)
                    this.highlight(context);
            }

            context.val(dateStr);            
        }
    }
    else
    {
        // context.addClass("notranslate");
        Field.Base.html_put(key, meta, context, data, options, dateStr);
        var now=new Date().getTime()/1000;
        var delta=Math.round((data-now)/(24*3600));
        if (delta>14)
            delta=14;
        else if (delta<-14)
            delta=-14;
        context.attr("field-timestamp-days", delta);
    }
}






/////////////////////////////////////////////////////////////////////////
Field.Relation=Object.create(Field.Base);

Field.Relation.meta_put=function(key, meta, context, options)
{

   if (Field.Base.meta_put(key, meta, context, options))
        return;

    context.addClass("field-put field-input");
    if (!meta.readonly && !options.readonly )
    {
        context.addClass("field-get");
    }

    //sub-meta-data is already resolved?
    if ('meta' in meta)
        Field.Relation.meta_put_resolved(key, meta, context, options)
    else
    {
        //asyncroniously resolve sub-metadata and cache the result in case another field needs it. (happens when displaying a list of client-resolved relations for example)
        if (!meta.get_meta_cache)
            meta.get_meta_cache={};

        rpc_cached(
            meta.get_meta_cache,
            10,
            meta.model+".get_meta",
            {},
            function(result)
            {
                //complete the submeta data and call actual function.
                //NOTE: the meta-variable is a reference to an entry in a cached meta-instance.(look in rpc.js for caching stuff)
                //Because of this the related meta-data we just resolved is also cached now.
                meta.meta=result.data;
                Field.Relation.meta_put_resolved(key, meta, context, options);
                context.trigger("meta_put_done");
            },
            "getting metadata from related model"
        );
    }
}

//get the context of the contained list of this relation
Field.Relation.list_context=function(key, context)
{
    return($('.field-list-source[field-key="'+key+'"]', context));
}



Field.Relation.meta_put_resolved=function(key, meta, context, options)
{
 
    //a relation with a list is a more complex type, so among other things it should have a field-list-source inside the context. 
    var list_context=Field.Relation.list_context(key, context);

    //a common mistake would be to give the field-list-source a field-meta-put, so catch it here:
    if (list_context.hasClass("field-meta-put"))
    {
        list_context.append($("<span class='ui-state-highlight'>program error: the list-source of a relation should not have a field-meta-put class!</span>"));
        console.error("program error: the list-source of a relation should not have a field-meta-put class!");
        return;
    }

    var recursive_options={};
    $.extend(recursive_options, options);
    if (meta.readonly)
        recursive_options.readonly=true;

    //recurse into list with sub-meta
    //use our context here: there are probably things like table headers that need meta-data descriptions
    //and list.meta_put can handle parent contexts as well as the list_context.
    Field.List.meta_put(key, meta.meta, context, recursive_options);


    //make sure we field-meta-put any headers or legends (overwrite stuff that the list or sub-dict has filled in)
    var selector='.field-meta-put[field-key="'+key+'"]';
    $(selector, context).each(function()
    {
        Field.Base.meta_put(key, meta, $(this), options);   
    });


    //make sure the list doesnt have a field-put and field-input, and we do. 
    //this is neccesary because field.releation needs to handle puts, especially with non-resolved data.
    list_context.removeClass("field-put field-input field-get");
    list_context.addClass("field-key-root"); //marker for from_element_get_data_keys


    if (meta.readonly || options.readonly)
    { 
        $(".field-relation-on-change-autocomplete", context).attr('disabled',true);
    }
    else
    {
        function create_autocomplete(this_context)
        {
      //      console.error("A");
            //we probably never want to activate in a listsource
            if (this_context.closest(".field-list-source").length != 0)
                return(false);

    //        var this_context=$(this).closest('.field-put[field-key="'+key+'"]');
    //        console.error("B", this);

             $(".field-relation-on-change-autocomplete", this_context).autocomplete({
                minLength: 0,
                autoFocus: true,
                //focus of selected suggestion has been changed
                focus: function( event, ui ) {
                    return(false);
                },
                //suggestion has been selected, add it to the list
                select: function (event, ui) {
                    $(this).val("");

                    if (meta.list)
                    {
                        Field.Relation.put(key, meta, this_context, [ ui.item.value ], {
                            list_no_remove: true,
                            list_no_add: false,
                            list_update: true,
                            show_changes: false
                        });
                    }
                    else
                    {
                        Field.Relation.put(key, meta, this_context, ui.item.value, {
                            list_no_remove: false, //we only want one item in the list, since this is not a list ;)
                            list_no_add: false,
                            list_update: true,
                            show_changes: false
                        });
                    }

                    return(false);
                },
                //data source
                source: function(request, response)
                {

                    //contruct or-based case insensitive regex search, excluding all the already selected id's
                    var params={}

                    //get currently selected ids
                    var current_items=Field.Relation.get(key, meta, this_context);
                    // console.log("currentitems", current_items);

                    //filter those ids out
                    var list_key=meta.meta.list_key;
                    params['match_nin']={};
                    params['limit']=25;
                    if (meta.list)
                        params['match_nin'][list_key]=current_items;
                    else
                        params['match_nin'][list_key]=[ current_items ];

                    var search_keys=$(".field-relation-on-change-autocomplete", this_context).attr("search-keys").split(" ");
                    params['regex_or']={}
                    $.each(search_keys, function(i, key_str)
                    {
                        params['regex_or'][key_str]=request.term;
                    });

                    var result_format=$(".field-relation-on-change-autocomplete", this_context).attr("result-format");

                    var sort=$(".field-relation-on-change-autocomplete", this_context).attr("sort-key");
                    if (sort)
                    {
                        params['sort']=[ [ sort, 1 ] ];
                    };

                    //allow customisation of the get_all parameters
                    if (context.data("field_relation_pre_get_all") && !context.data("field_relation_pre_get_all")(params))
                    {
                        response([]);
                        return(true);
                    }

                    //call the foreign model to do the actual search
                    rpc(meta.model+".get_all",
                        params,
                        function (result)
                        {
                            viewShowError(result,this_context,meta);
                            //construct list of search-result-choices for autocomplete
                            choices=[]
                            for (i in result.data)
                            {
                                choices[i]={
                                    label: ControlBase.prototype.format(result_format, result.data[i]),
                                    value: result.data[i]
                                }
                            }
                            response(choices);
                        },
                        'relation autocomplete');
                }
            })
            return(true);
        }


        $(".field-relation-on-click-add", context).click(function()
        {
           var this_context=$(this).closest('.field-put[field-key="'+key+'"]');
            if (create_autocomplete(this_context))
            {
                $(".field-relation-on-change-autocomplete", this_context).autocomplete("search", $(this).val());
                return(false)
            }
            else
            {
                return(true);
            }
        })

        //this makes auto complete clonable
        $(".field-relation-on-change-autocomplete", context).on('focus',function()
        {
            var this_context=$(this).closest('.field-put[field-key="'+key+'"]');

            if (create_autocomplete(this_context))
                return(false)
            else
                return(true);
        });


        //field.list also catches this, but we need some special treatment so we overrule it
        $(list_context.parent()).off("control_form_changed control_form_created").on("control_form_changed control_form_created",function(event,result)
        {
            console.log("field.relation: view opened by us has changed the data", result);

            var data;
            if (meta.list)
                data=[ result.data ];
            else
                data=result.data;

            Field.Relation.put(
                key, 
                meta,
                $(this).closest('[field-key="'+key+'"]'),
                data, 
                {
                    list_no_remove: meta.list,
                    list_no_add: false, 
                    list_update: true,
                    show_changes: true
                }
            );
            return(false);
        });

    } //not readonly

    //special handler that is used for searching: it emits a field_change event with a list of _id's that match the search text.
    var search_txt;
    $(".field-relation-on-change-search", context).on('input change', function()
    {
        if (search_txt==$(this).val())
            return (false);

        search_txt=$(this).val();
        if (search_txt=="" && context.attr("field-allow-null")=="")
        {
            context.trigger('field_changed', [ key, meta, context, null ]); 
            return(false)           
        }

        //contruct or-based case insensitive regex search
        var params={}

        params['fields']=[ meta.meta.list_key ];


        var search_keys=$(this).attr("search-keys").split(" ");
        params['regex_or']={}
        $.each(search_keys, function(i, key_str)
        {
            params['regex_or'][key_str]=search_txt;
        });

        //call the foreign model to do the actual search
        rpc(meta.model+".get_all",
            params,
            function (result)
            {
                viewShowError(result,context,meta);
                data=[]
                for (i in result.data)
                {
                    data[i]=result.data[i][meta.meta.list_key];
                }
                context.trigger('field_changed', [ key, meta, context, data ]); 

            },
            'relation search');

        return(false);
    });





    //data in related model was changed
    $(context).subscribe(meta.model+'.changed', "fields", function(data)
    { 

        console.log("field.relation: data on server has changed",data, this);

        if (meta.list)
            data=[ data ];

        Field.Relation.put(
            key, 
            meta, 
            $(this).closest('[field-key="'+key+'"]'),
            data, 
            {
                list_no_remove: true,
                list_no_add: true, 
                list_update: true,
                show_changes: true
            }
        );



        return(false);
    });

    //data in related model was deleted
    //NOTE: control_form_deleted is ALSO triggered in Field.List, but this doesnt seem to be a problem right now
    $(context).subscribe(meta.model+'.deleted', "fields", function(data)
    {

        console.log("field.relation: data on server has been deleted", data, this);


        var list_key=meta.meta.list_key;

        var element=Field.List.find_element(
            key,
            meta.meta,
            $(this),
            [ data[list_key] ]
        );

        element.hide(1000, function()
        {
            element.remove();
        });

        return(false);
    });



/*
just notes and scribling...not actual documentation of the function..

 1. do all the rpc stuff here
    -also the autocomplete jquery widget? we could reattach eventhandlers in meta_put
    -straigh forward, but seems hackish
      -a field.put will result in another rpc call to get the foreign data

 2. do all the rpc stuff in form-control
    -Field.Relation can basically ignore put and meta_put 
    -seems less hackish somehow ?
    -ield.js only should handle local data and does do rpc calls itself?

 3. create a seperate control-class for relations
    -seems a cleaner solution
    -where/how to create and update the control-class?
      -in the control? 
        -need to implement it for both controllist and controlform that way
        -how to handle all relation objects?
          -traverse all meta data?
          -create a seperate css control-relation class?
      -in field.relation?
        -create in meta_put
        -on field.put, call control.get_result  (control.get doesnt actually exist in that case)
        -on field.get, call control....? 
          so this is also kind of hackish since its no real subcontrol
          option 1. seems less hackish now :)


choosen solution: we have 2 modes to chose from:
    when meta.resolve is true, the server resolves and returns the related metadata.
    when its false, Field.Relation will have to call the meta_data and actual data from the forgein model itself.

    during auto-completion, Field.Relation will ALWAYS call the foreign model.
*/
}



Field.Relation.put=function(key, meta, context, data, options)
{
    var options_copy={};
    $.extend(options_copy, options);


    //add a handler that gets triggered as soon as metadata is resolved
    context.off("meta_put_done").on("meta_put_done", function()
    {
        // console.log("field.relation.put key:", key);
        // console.log("field.relation.put meta:", meta);
        // console.log("field.relation.put context:", context);
        // console.log("field.relation.put data:", data);
        // console.log("field.relation.put options:", options);

        var list_context=Field.Relation.list_context(key, context);
        if (meta.list)
        {
            //no data
            if (data==null)
            {
                Field.List.put(key, meta.meta, list_context, [], options_copy);
            }

            //if its empty or already resolved, directly recurse into sub-meta list
            //NOTE: we dont check this via meta.resolve, because sometime we need to put unresolved data into it as well. (in case of a changed-event for example)
            else if ((data.length==0) || (typeof(data[0])=='object'))
            {
                Field.List.put(key, meta.meta, list_context, data, options_copy);
            }

            //need to resolve the data asyncronisously
            else 
            {
                function resolve_data()
                {
                    var get_params={
                        'match_in': {}
                    };

                    get_params['match_in'][meta.meta.list_key]=data;

                    //get related data
                    rpc(
                        meta.model+".get_all",
                        get_params,
                        function(result)
                        {
                            //also store items that cant be resolved (usually relations to protected items)
                            var hidden_data=data.slice(0);
                            for (i in result.data)
                            {
                                var id=result.data[i][meta.meta.list_key];
                                var i=hidden_data.indexOf(id);
                                if (i!=-1)
                                    hidden_data.splice(i,1);
                            }
                            $(context).data('field-relation-hidden', hidden_data);

                            Field.List.put(key, meta.meta, list_context, result.data, options_copy);
         
                        },
                        "getting data from related model"
                    );
                };

                //do we want to resolve it now or later when the user hovers the mouse
                if ($(context).attr("field-relation-delayed")=="")
                {
                    //this offcourse doesnt work with delayed data resolving. (it always thinks there's a change that way)
                    options_copy.show_changes=false;

                    //fill the list with stub data
                    var stub_data=[];
                    for (i in data)
                    {
                        stub_data.push({ '_id': data[i] });
                    };

                    Field.List.put(key, meta.meta, list_context, stub_data, options);
     
                    var resolved=false;
                    $(context).off("mouseenter").on( "mouseenter", function(event)
                    {
                        if (resolved)
                            return;
                        resolved=true;
                        resolve_data();
                        return(false);
                    });
                }
                else
                {
                    resolve_data();                    
                }
            };
        }
        else
        {
            if (data==null)
            {
                Field.List.put(key, meta.meta, list_context, [  ], options);
            }
            //if already resolved, directly recurse into the list
            //NOTE: we dont check this via meta.resolve, because sometime we need to put unresolved data into it as well. (in case of a changed-event for example)
            else if (typeof(data)=='object')
            {
                // if (options.relation_update && context.attr("field-relation-id")!=data[meta.meta.list_key])
                //     return;

                // Field.Dict.put(key, meta.meta.meta, context, data, options);
                Field.List.put(key, meta.meta, list_context, [ data ], options);
                // if (data[meta.meta.list_key])
                //     context.attr("field-relation-id", data[meta.meta.list_key]);
                // else
                //     context.removeAttr("field-relation-id");

            }
            else 
            {
                // if (options.relation_update && context.attr("field-relation-id")!=data)
                //     return;

                var get_params={};
                get_params[meta.meta.list_key]=data;
                //get related data
                rpc(
                    meta.model+".get",
                    get_params,
                    function(result)
                    {
                        // Field.Dict.put(key, meta.meta.meta, context, result.data, options);
                        // context.attr("field-relation-id", result.data[meta.meta.list_key]);
                        Field.List.put(key, meta.meta, list_context, [ result.data ], options);

                    },
                    "getting data from related model"
                );
            }

        }

    });

    //metadata already resolved?
    if ('meta' in meta)
        context.trigger("meta_put_done");
    else
    {
        if (! ('get_meta_cache' in meta))
        {
            console.error("relation.put: no meta-data resolved. use field-meta-put instead of field-put.");
        }
    }
}


Field.Relation.get=function(key, meta, context)
{

    var list_context=Field.Relation.list_context(key, context);

    //recurse into sub-meta list
    data=Field.List.get(key, meta.meta, list_context);
 
    //always "de-resolve" data, by converting it to an array of id's
    //(the put-call on the server is able to automagically handle resolved and deresolved data anyway, so spare the overhead)
    var ids=[];
    $.each(data, function(key, value)
    {
        ids.push(value[meta.meta.list_key]);
    });

    if ($(context).data('field-relation-hidden'))
    {
        ids=ids.concat($(context).data('field-relation-hidden'));
    }

    if (meta.list)
        return(ids)
    else
    {
        if (ids.length>0)
            return(ids[0]);
        else
            return(null);
    }
}

//this is a bit confusing...this is another kind of resolving (used by all field types)
//dont confuse it with asyncronisous resolving of meta-data and data for relations.
Field.Relation.resolve_meta=function(meta, keys)
{
    if (keys.length==0)
        return(meta);
//    console.error("resolve in list", meta, keys)f;
    return(Field[meta.meta.type].resolve_meta(meta.meta, keys));
}

/** 
 * Determines the data-key-array of the specified element.
 *
 * This one is for the special case of the Relation: 
 * We dont want to concat the parent keys, since the data_key path is usually used for focussing the field in a new view.
 *
 */
/*Field.Relation.find_data_keys=function(keys, meta, element)
{

    console.log("njeg");
    //return(keys);

}*/




