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
Field.Base.meta_put=function(key, meta, context)
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

/** 
 * Determines the data-key-array of the specified element.
 *
 * The first time you call it you have to specify keys_left by using Field.Base.keys on the field-key of the element.
 *
 */
Field.Base.find_data_keys=function(keys, meta, element)
{
    var this_key=keys.pop();

    var data_keys=[this_key];

    //do we have any more keys left?
    if (keys.length!=0)
    {
        //resolve the metadata of the parent
        var this_meta=Field.Base.resolve_meta(meta, keys);
        console.log("this meta", keys, this_meta);

        //call the find_keys function of the parents datatype
        var parent_keys=Field[this_meta['type']].find_data_keys(keys, meta, element);

        //append our data_keys to the parent_keys
        data_keys=parent_keys.concat(data_keys);
    }

    return(data_keys);

}


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
    //dict operates on a bigger context, but meta_put is expecting direct element, so give it that:
    if (key)
    {
        var selector='.field-meta-put[field-key="'+key+'"]';
        $(selector, context).each(function()
        {               
            Field.Base.meta_put(key, meta, $(this));
        });
    }

    //traverse the sub meta data
    $.each(meta.meta, function(sub_key, thismeta){
        var key_str=Field.Base.concat_keys(key, sub_key);
        if (thismeta.type=='Dict')
        {
            //handle sub-dicts in the same context. this way you can use keys
            //like foo.subdict, without needing a surrounding element that has key foo.
            Field.Dict.meta_put(key_str, thismeta, context);
        }
        else
        {
            var selector='.field-meta-put[field-key="'+key_str+'"]';
             //traverse the field-meta-put elements for this key:
            $(selector, context).each(function()
            {
                if (thismeta.type in Field)
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

                //traverse the field-put elements for this key:
                $(selector, context).each(function()
                {
                    if (thismeta.type in Field)
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
//    console.log("Dict.find_element", key, meta, context, data_keys);

    var this_key=data_keys[0];
    var sub_keys=data_keys.slice(1);
    var sub_meta=meta.meta[this_key];

    //non existing key
    if (sub_meta==undefined)
    {
        if (sub_keys.length==0)
            return(context);

        //ignore non-existing keys. this happens due to relations. 
        return(Field.Dict.find_element(key_str, meta, context, sub_keys ));
    }

    var key_str=Field.Base.concat_keys(key, this_key);
    var selector='.field-put[field-key="'+key_str+'"]';
    var sub_context=$(selector, context);

    //if the key is not found, just keep looking in the same context for the next one
    if (sub_context.length==0)
        sub_context=context;

    //recurse into substuff
    return(Field[sub_meta.type].find_element(key_str, sub_meta, sub_context, sub_keys ));
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

Field.List.meta_put=function(key, meta, context)
{
//    console.log("list metaput", key, meta, context);
    if (Field.Base.meta_put(key, meta, context))
        return;

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
    Field[meta.meta.type].meta_put(key, meta.meta, context);

    //after the submeta data is done, attach event handlers for listsources
    if (list_source)
    {
        //create an add-handler to add items to lists
        list_source.parent().off("click", ".field-list-on-click-add").on("click", ".field-list-on-click-add", function(){
            Field.List.from_element_add(null, this);
        });
        
        //create an add-handler if the source-element of a list is focussed
        list_source.parent().off("focus", ".field-list-on-focus-add :input").on("focus", ".field-list-on-focus-add :input", function(){
            //only add an item if the user focusses a field in the listsource..
            //console.error(from_element_get(null, $(this)));
            if (Field.List.from_element_get(null, $(this)).hasClass("field-list-source"))
            {
                var added_item=Field.List.from_element_add(null, this);

                //refocus the same input on the new item 
                $('.field-input[field-key="'+$(this).attr("field-key")+'"]', added_item).focus();
            }
        });
        
        //create a handler to delete a list item
        list_source.parent().off("click", ".field-list-on-click-del").on("click", ".field-list-on-click-del", function(){
            var clicked_element=Field.List.from_element_get(null, this);
            if (clicked_element.hasClass("field-list-item"))
            {
                    clicked_element.hide('fast',function()
                    {
                        clicked_element.remove();
                    });
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
        $(list_source).off("control_form_changed control_form_created").on("control_form_changed control_form_created",function(event,result)
        {
            console.log("field.list: view opened by us has changed the data", result);
            Field.List.put(
                key,
                meta,
                $(this),
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
                 $(this).remove();
             });
            return(false);
        });

        //create handler to open a view to edit the clicked element, or create a new element (in case the user clicked the field-list-source)
        $(list_source.parent()).on("click",".field-list-on-click-view",  function(event)
        {
            if (meta.list_key==undefined)
            {
                console.error("Cant view list item, since there is no list_key defined in the metadata",this );
                return(true);
            }

            var list_id=Field.List.from_element_get_id(list_source.attr("field-key"), this);

            var element=$(this);
            //element.addClass("ui-state-highlight");
        
            //create the view to edit the clicked item
            var editView={};
            editView.params={};

            //determine focus field:
            var keys=Field.Base.keys($(this).attr("field-key"));
            editView.focus=Field.Base.find_data_keys(keys, meta.meta, $(this));
            //TODO: option to strip focus keys in case of relations?

            editView.params[meta.list_key]=list_id;
            editView.x=event.clientX;
            editView.y=event.clientY;

            editView.name=list_source.attr("field-list-view");
            editView.mode=list_source.attr("field-list-view-mode");
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

/*
 options.list_update: update an existing list, instead off removing and recreating it. 
 usefull with options.show_changes, to give user feedback of changes, or with endless scrolling.

 options.list_no_remove: dont remove existing items. usefull for endless scrolling.

 options.list_no_add: dont add new items. only update existing items.
*/

Field.List.put=function(key, meta, context, data, options)
{
//    console.log("Field.List.put: ", key ,meta, context, data, options);

    var parent=context.parent();

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
                if (meta.list_key)
                {
                    //try to find existing element
                    //the field-key and field-list-id should both match
                    update_element=$('.field-list-item[field-key="'+key+'"][field-list-id="'+item_value[meta.list_key]+'"]', parent);
                    if (update_element.length==0)
                        update_element=undefined;
                }
                else
                {
                    //just use plain item_nr array adressing:
                    if (item_nr < existing_items.length)
                        update_element=$(existing_items[item_nr]);
                }
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
                    update_element.insertBefore(context);
                }
            }
            //found, make sure its not deleted
            else
            {
                if (options.list_update)
                    update_element.removeClass("field-list-delete");
            }
            
            //finally put data into it
            Field[meta.meta.type].put(key, meta.meta, update_element, item_value, options);

            prev_element=update_element;
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
    console.log("Field.List.get", key, meta, context);

    var values=new Array();
    var parent=context.parent();
    
    //traverse all the list items
    $('.field-list-item[field-key="'+key+'"]', parent).each(function(){
        console.log("Field.List.get item", this);
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
//    console.log("Field.List.find_element", key, meta, context, data_keys);

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

    //does the list use indexes or list-keys to identify an item?
    if ('list_key' in meta)
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
Field.List.find_data_keys=function(keys, meta, element)
{
    //determine the list_id of the specified element:
    var key_str=Field.Base.concat_keys('',keys);
    console.log("list keystr", keys, key_str);
    var list_id=Field.List.from_element_get_id(key_str, element);
    var data_keys=[list_id];

    //let the base class handle the rest
    var parent_keys=Field.Base.find_data_keys(keys, meta, element);

    //append our list_id to the parent_keys and return that
    data_keys=parent_keys.concat(data_keys);

    return(data_keys);

}

Field.List.resolve_meta=function(meta, keys)
{
//    console.error("resolve in list", meta, keys);
    return(Field.Base.resolve_meta(meta.meta, keys));
}




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

    if (context.attr("field-allow-null")=="" && val=="")
                return (null);

    return (val);
}

Field.String.put=function(key, meta, context, data, options)
{
//    console.log("String.put", key , meta, context, data, options);
    if (context.hasClass("field-input"))
        context.val(data);
    else
    {
        if (data==null)
            Field.Base.html_append(key, meta, context, data, options, "");
        else
            Field.Base.html_append(key, meta, context, data, options, data);
    }
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
    else if (Number(val)!=val)
        return val;
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
                $("<div>") 
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






/////////////////////////////////////////////////////////////////////////
Field.Relation=Object.create(Field.Base);

Field.Relation.meta_put=function(key, meta, context)
{

   if (Field.Base.meta_put(key, meta, context))
        return;

    context.addClass("field-put field-input field-get");

   //sub-meta-data is already resolved?
    if ('meta' in meta)
        Field.Relation.meta_put_resolved(key, meta, context)
    else
    {
        //asyncroniously resolve sub-metadata
        if (!meta.get_meta_cache)
            meta.get_meta_cache={};

        rpc_cached(
            meta.get_meta_cache,
            10,
            meta.model+".get_meta",
            {},
            function(result)
            {
                //complete the submeta data and call actual function
                meta.meta=result.data;
                Field.Relation.meta_put_resolved(key, meta, context);
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

Field.Relation.meta_put_resolved=function(key, meta, context)
{
 
    //a relation is a more complex type, so among other things it should have a field-list-source inside the context. 
    var list_context=Field.Relation.list_context(key, context);

    //a common mistake would be to give the field-list-source a field-meta-put, so catch it here:
    if (list_context.hasClass("field-meta-put"))
    {
        list_context.append($("<span class='ui-state-highlight'>program error: the list-source of a relation should not have a field-meta-put class!</span>"));
        console.error("program error: the list-source of a relation should not have a field-meta-put class!");
        return;
    }


    //recurse into list with sub-meta
    //use our context here: there are probably things like table headers that need meta-data descriptions
    //and list.meta_put can handle parent contexts as well as the list_context.
    Field.List.meta_put(key, meta.meta, context);

    //make sure the list doesnt have a field-put and field-input, and we do. 
    //this is neccesary because field.releation needs to handle puts, especially with non-resolved data.
    list_context.removeClass("field-put field-input field-get");

    $(".field-relation-on-click-add", context).click(function()
    {
        $(".field-relation-on-change-search", context).autocomplete("search", $(this).val());
//        $(".field-relation-on-change-search", context).focus();
    })

    // $(".field-relation-on-change-search", context).focus(function()
    // {
    //     $(".field-relation-on-change-search", context).autocomplete("search", $(this).val());
    // });


    $(".field-relation-on-change-search", context).autocomplete({
        minLength: 0,
        autoFocus: true,
        //focus of selected suggestion has been changed
        focus: function( event, ui ) {
            return(false);
        },
        //suggestion has been selected, add it to the list
        select: function (event, ui) {
            $(this).val("");

//            if (meta.resolve==true)
            //console.log("in ", $(".field-list-source", context));
            Field.List.put(key, meta.meta, list_context, [ ui.item.value ], {
                list_no_remove: true,
                list_update: true,
                show_changes: true

            });
            return(false);
        },
        //data source
        source: function(request, response)
        {

            //contruct or-based case insensitive regex search, excluding all the already selected id's
            var params={}

            //get currently selected ids
            var current_items=Field.List.get(key, meta.meta, list_context);
            console.log("currentitems", current_items);

            //filter those ids out
            var list_key=meta.meta.list_key;
            params['match_nin']={}
            params['match_nin'][list_key]=[];

            $.each(current_items, function(i, item)
            {
                params['match_nin'][list_key].push(item[list_key]);
            });


            var search_keys=$(".field-relation-on-change-search", context).attr("search-keys").split(" ");
            params['regex_or']={}
            $.each(search_keys, function(i, key_str)
            {
                params['regex_or'][key_str]=request.term;
            });

            var result_format=$(".field-relation-on-change-search", context).attr("result-format");

            //call the foreign model to do the actual search
            rpc(meta.model+".get_all",
                params,
                function (result)
                {
                    viewShowError(result,context,meta);
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
                'relation autocomplete search');
        }
    })

    //data in related model was changed
    //NOTE: control_form_changed is ALSO triggered in Field.List, but this doesnt seem to be a problem right now
    $(list_context).subscribe(meta.model+'.changed', "fields", function(result)
    { 

        console.log("field.relation: data on server has changed",result, this);

        Field.List.put(
            key, 
            meta.meta, 
            $(this),
            [ result.data ],
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
    $(list_context).subscribe(meta.model+'.deleted', "fields", function(result)
    {

        console.log("field.relation: data on server has been deleted", result);

        var list_key=meta.meta.list_key;

        var element=Field.List.find_element(
            key,
            meta.meta,
            $(this),
            [ result.data[list_key] ]
        );

        element.hide(1000, function()
        {
            element.remove();
        });

        return(false);
    });



/*
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


Field.Relation.get=function(key, meta, context)
{
    var list_context=Field.Relation.list_context(key, context);

    //recurse into sub-meta list
    data=Field.List.get(key, meta.meta, list_context);
    if (meta.resolve)
        return(data);
    else
    {
        //"de-resolve" data, by converting it to an array of id's
        var ids=[];
        $.each(data, function(key, value)
        {
            ids.push(value[meta.meta.list_key]);
        });
        return(ids);
    }
}

Field.Relation.put=function(key, meta, context, data, options)
{
    var list_context=Field.Relation.list_context(key, context);

    //if its empty or already resolved, directly recurse into sub-meta list
    //NOTE: we dont check this via meta.resolve, because sometime we need to put unresolved data into it as well. (in case of a changed-event for example)
    if ((data.length==0) || (typeof(data[0])=='object'))
        Field.List.put(key, meta.meta, list_context, data, options);
    else 
    {
        var get_params={
            'match_in': {}
        };

//        if (data && data.length>0)
        {
            get_params['match_in'][meta.meta.list_key]=data;
            //get related data
            rpc(
                meta.model+".get_all",
                get_params,
                function(result)
                {
                    //add a handler that gets triggered as soon as metadata is resolved
                    context.off("meta_put_done").on("meta_put_done", function()
                    {
                        Field.List.put(key, meta.meta, list_context, result.data, options);
                    });

                    //metadata already resolved?
                    if ('meta' in meta)
                        context.trigger("meta_put_done");
                },
                "getting data from related model"
            );
        }
    }

}






