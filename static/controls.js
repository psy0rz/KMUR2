//////////////////////////////////////////////////////////////////////////////////////////
//base-class for all controllers
/* 
params:
    view:                view to operate on. view.id is used to determine jquery this.context. 
    class:               rpc-class-name to call (used to fill in default values)

    get_meta:            rpc-method called to get metadata (default: class+".get_meta")
    get_meta_params      parameters to pass to get_meta (default: view.params)
    get_meta_result      called with results of get_meta

    get:                 rpc-method called to get data (default: class+".get")
    get_params           parameters to pass to get (default: view.params)
    get_result           called with results of get data 
    title:               title to set after get. (will be processed by format(..,result))

    delete:              rpc-method called to delete data (default: class+".delete")
    delete_params        parameters to pass to put (default: view.params)

Other items in params documented in the subclasses below.

*/
function ControlBase(params)
{
    //constructor
    this.params=params;
    this.context=$("#"+params.view.id);
    this.debug_txt=params.view.id+" "+params.view.name+" ";

    if (!('get_meta' in params))
        params.get_meta=params.class+".get_meta";

    if (!('get_meta_params' in params))
        params.get_meta_params=params.view.params;

    if (! params.get_meta_result)
        params.get_meta_result=function(){};


    if (!('get' in params))
        params.get=params.class+".get";

    if (!('get_params' in params))
        params.get_params=params.view.params;

    if (! params.get_result)
        params.get_result=function(){};

    if (!('title' in params))
        params.title="Untitled "+params.view.id;

    if (!('delete' in params))
        params.delete=params.class+".delete";

    if (!('delete_params' in params))
        params.delete_params=params.view.params;



}

/**
 Substitute macros found in text with data.

 Example: format("your name is {name}", { 'name': 'foobs' })
 Returns: "your name is foobs"
*/
ControlBase.prototype.format=function(txt, data)
{
    var key;
    var ret=txt;
    while(matches=ret.match(/\{\w*\}/))
    {
        key=matches[0].substr(1,matches[0].length-2);
        //console.log("found ", key);
        if (key in data)
        {
            ret=ret.replace(matches[0], data[key]);
        }
        else
        {
            ret=ret.replace(matches[0], "");
        }
    }

    return(ret)
}


//gets metadata for this control and fills in metadata in the specified this.context
//calls this.get_meta_result with the results
//the request_params are just passed along to get_meta_result, and may be used to identify the request or to pass arbitrary parameters around.
ControlBase.prototype.get_meta=function(request_params)
{   
    if (this.params.get_meta)
    {
        //get meta data
        this.meta={};
        var this_control=this;
        rpc(this.params.get_meta, 
            this.params.get_meta_params,
            function(result) { this_control.get_meta_result(result, request_params) },
            this.debug_txt+"control getting meta data"
        );
    }
    else
    {
        //NOTE:not loading data, we still call get_result with an empty result.
        this.get_meta_result({}, request_params);
    }
}


//gets data from the rpc server 
ControlBase.prototype.get=function(request_params)
{
    if (this.params.get)
    {
        //get data
        var this_control=this;
        rpc(
            this.params.get, 
            this.params.get_params,
            function(result) { this_control.get_result(result, request_params) },
            this.debug_txt+"getting control data"
        );
    }
    else
    {
        //NOTE:not loading data, we still call get_result with an empty result.
        this.get_result({}, request_params);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
//form controller
/*
params:
    (look in the baseclass for the basic documentation)


    put:                 rpc-method called to put data (default: class+".delete")
    put_params           parameters to pass to put (default: view.params)
    put_result           called with results of put data 

    close_after_safe     close the view after succesfully saving the data

    delete_result        called with results of del

*/
function ControlForm(params)
{
    ControlBase.call(this,params);


    if (!('close_after_save' in params))
        params.close_after_save=true;

    if (!('put' in params))
        params.put=params.class+".put";

    if (!('put_params' in params))
        params.put_params=params.view.params;

    if (! params.put_result)
        params.put_result=function(){};


    if (! params.delete_result)
        params.delete_result=function(){};


    this.get_meta();
}
ControlForm.prototype=Object.create(ControlBase.prototype);


ControlForm.prototype.get_meta_result=function(result, request_params)
{
    this.params.get_meta_result(result, request_params);

    if (viewShowError(result, this.context, this.meta))
        return;
    
    if (!('data' in result))
        return;

    //all default models are ListDicts, and since a form is editting one item from that list, we should
    //use the Dict, so we use .meta:
    this.meta=result['data'].meta;
    Field[this.meta.type].meta_put('',this.meta, this.context);

    this.attach_event_handlers();   
    this.get(request_params);
}


ControlForm.prototype.get_result=function(result, request_params)
{
    this.params.get_result(result, request_params);

    // $(".control-on-click-save", this.context).prop("disabled", false);
    if (('data' in result) && (result.data != null) )
    {
        Field.Dict.put('', this.meta, this.context, result.data)
    }
    
    this.focus();

    viewShowError(result, this.context, this.meta);

    viewReady({
        'view': this.params.view,
        'title': this.format(this.params.title, result)
    });

}


ControlForm.prototype.attach_event_handlers=function()
{
    var this_control=this;
    var context=this.context;

    //create an add-handler to add items to lists
    $(".control-on-click-list-add", context).off().click(function(){
        Field.List.from_element_add(this);
    });
    
    //create an add-handler if the source-element of a list is focussed
    $(".control-on-focus-list-add :input", context).off().focus(function(){
        var added_item=Field.List.from_element_add(this);

        //refocus the same input on the new item 
        $('.field-input[field-key="'+$(this).attr("field-key")+'"]', add_element).focus();
    });
    
    //create a handler to delete a list item
    $(".control-on-click-list-del", context).off().click(function()
    {
        var clicked_element=Field.List.from_element_get(this);
        if (clicked_element.hasClass("field-list-item"))
        {
            $(this).confirm(function()
            {
                clicked_element.hide('fast',function()
                {
                    clicked_element.remove();
                });
            });
        }
    });
    
    //make lists sortable
    $(".control-list-sortable", context).off().sortable({
        //placeholder: "",
        handle: ".control-on-drag-sort",
        cancel: ".field-list-source",
        items:"> .field-list-item",
        forceHelperSize: true,
        forcePlaceholderSize: true
    });


    $(".control-on-click-save", context).off().click(function()
    {
        this_control.put();
    });

    //pressing enter will also save:
    $(context).off().bind('keypress', function(e) 
    {
        if (e.keyCode==$.ui.keyCode.ENTER && e.target.nodeName.toLowerCase()!="textarea")
        {
            this_control.put();
        }
    });
    
    $(".control-on-click-del", context).off().click(function() 
    {
        $(this).confirm(function() {
            this_control.delete();
        });
    });

    $(".control-on-click-cancel", context).off().click(function()
    {
        viewClose(this_control.params.view);
    });
}


//focus the correct input field
ControlForm.prototype.focus=function()
{
    if (this.params.view && this.params.view.focus)
        $(this.context).autoFindElement(this.meta, this.params.view.focus).focus();
    else if (this.params.default_focus)
        $(this.context).autoFindElement(this.meta, this.params.default_focus).focus();
    else
        $(".control-default-focus", this.context).focus();
}


//save the form data by calling the put rpc function
ControlForm.prototype.put=function(request_params)
{

    //are there put_params that we should COPY?
    var put_params={};
    if (this.params.put_params)
        put_params=jQuery.extend(true, put_params, this.params.put_params); //COPY, and not by reference!

    //get the data and store it into our local put_params
    put_params=jQuery.extend(true, put_params, Field.Dict.get('', this.meta, this.context));

    //call the put function on the rpc server
    var this_control=this;
    rpc(
        this.params.put,
        put_params,
        function(result) { this_control.put_result(result, request_params) },
        this.debug_txt+"form putting data"
    );
}

ControlForm.prototype.put_result=function(result, request_params)
{
    this.params.put_result(result, request_params);

    if (!viewShowError(result, this.context, this.meta) && (this.params.close_after_save))
        viewClose(this.params.view);

    $(".view").trigger('refresh');
    
}

//delete the item instead of saving it
ControlForm.prototype.delete=function(request_params)
{

    var this_control=this;
    rpc(
        this.params.delete, 
        this.params.delete_params,
        function(result) { this_control.delete_result(result, request_params) },
        this.debug_txt+"form deleting item"
    );
}

ControlForm.prototype.delete_result=function(result, request_params)
{
    this.params.delete_result(result, request_params);
    if (!viewShowError(result, this.context, this.meta))
    {
        $(".view").trigger('refresh');

        if (this.params.close_after_save)
            viewClose(this.params.view);
    }
}


//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//list controller
/*
params:
    (look in the baseclass for the basic documentation)
    
    edit_view: View that is opened when a user clicks an element with class .control-on-click-edit
    get: rpc-call to get data, if not specified will be set to class.get_all

*/
function ControlList(params)
{
    if (!('get' in params))
        params.get=params.class+".get_all";

    ControlBase.call(this, params);

    if (typeof (params.get_params) ==='undefined')
        params.get_params={};

    this.list_source_element=$(".field-list-source:first", this.context);
    this.list_begin_length=this.list_source_element.parent().children().length;

    this.view_ready=false;

    this.get_meta(false);
}
ControlList.prototype=Object.create(ControlBase.prototype);

ControlList.prototype.get_meta_result=function(result, request_params)
{
    this.params.get_meta_result(result, request_params);

    if (viewShowError(result, this.context, this.meta))
        return;
    
    if (!('data' in result))
        return;

    this.meta=result['data'];

    //call meta_put on the whole view, with the subdict:
    Field.Dict.meta_put('',this.meta.meta, this.context);

    this.attach_event_handlers();   
    this.get(request_params);
}



//this one only calls this.get, if its not already busy getting data.
//otherwise just sets a flag, so that get_result will call get again as soon as its done.
//this way multiple calls are not queued and not executed in parallel. (which is nice for for ordering and filtering)
ControlList.prototype.get_delayed=function(request_params)
{
    if (!this.getting)
    {
        this.getting=true;
        this.get(request_params);
    }
    else
    {
        this.get_again=true;
        this.get_again_request_params=request_params;
    }
}

//request_params will be true in case of an endless scrolling update
ControlList.prototype.get_result=function(result, request_params)
{
    this.getting=false;
    if (this.get_again)
    {
        this.get_again=false;
        this.get_delayed(this.get_again_request_params);
    }

    this.params.get_result(result, request_params);

    viewShowError(result, this.context, this.meta);

    if ('data' in result)
    {
        Field.List.put(
            '',
            this.meta,
            this.list_source_element,
            result.data,
            {
                list_update: request_params,
                list_no_remove: request_params
            }
        );
    }

    if (!this.view_ready)
    {
        viewReady({
            'view': this.params.view,
            'title': this.format(this.params.title, result)
        });
        this.view_ready=true;
    }

}

//TODO: just handle this in get_meta_result
ControlList.prototype.attach_event_handlers=function()
{   
    var this_control=this;
    var context=this.context;

    //refresh the list when we receive a refresh event
    $(context).off().bind('refresh',function()
    {
        //console.log("reresh!!");
        this_control.get_delayed(true);
    });

    //open a view to edit the clicked element
    $(".control-on-click-edit", context).off().click(function(event)
    {
        var listParent=Field.List.from_element_get(this);
        
        var element=$(this);
        var id=listParent.attr("field-list-id");
        var index=listParent.attr("field-list-key");
        element.addClass("ui-state-highlight");
    
        //create the view to edit the clicked item
        var editView={};
        $.extend( editView, this_control.params.edit_view );
        if (! editView.params)
            editView.params={};

        editView.focus=$(element).autoFindKeys(this_control.meta);
        if (typeof id != "undefined")
            editView.params[index]=id;
        editView.x=event.clientX;
        editView.y=event.clientY;
        viewCreate(
            {
                creator: element
            },
            editView);
    });

    //delete the element, after confirmation
    $(".control-on-click-del", context).off().click(function(event)
    {
        var listParent=Field.List.from_element_get(this);
        var id=listParent.attr("_id");
        var index=listParent.attr("_index");

        $(this).confirm(function()
        {
            var rpcParams={};
            rpcParams[index]=id;
            rpc(
                this_control.params.delete,
                rpcParams,
                function(result)
                {
                    if (!viewShowError(result, listParent, meta))
                    {
                        $(".view").trigger('refresh');
                    }
                },
                this_control.debug_txt+"list deleting item"
            );
        });
    });


    /// ORDER STUFF
    
    //what is the current selected sorting column?
    function getSortSettings()
    {
        this_control.params.get_params.sort={};
        $(".control-order-asc",context).each(function()
        {
            this_control.params.get_params.sort[$(this).attr("_key")]=1;
        });
        $(".control-order-desc",context).each(function()
        {
            this_control.params.get_params.sort[$(this).attr("_key")]=-1;
        });
    }
    getSortSettings();

    $(".control-on-click-order", context).off().click(function()
    {
        //NOTE:it would be possible to select multiple columns for sorting, but  this is a bit too unclear in the UI and backend

        //change to desc
        if ($(this).hasClass("control-order-asc"))
        {
            $(".control-on-click-order", context).removeClass("control-order-asc").removeClass("control-order-desc");
            $(this).addClass("control-order-desc");
        }
        //change to unsorted
        else if ($(this).hasClass("control-order-desc"))
        {
            $(".control-on-click-order", context).removeClass("control-order-asc").removeClass("control-order-desc");
        }
        //start with asc
        else
        {
            $(".control-on-click-order", context).removeClass("control-order-asc").removeClass("control-order-desc");
            $(this).addClass("control-order-asc");
        }

        getSortSettings();
        this_control.get_delayed(false);
    });


    $(".control-on-filter-highlight",context).on('click', function(e)
    {
        if ($(e.srcElement).hasClass("control-on-filter-highlight"))
        {
            //reset all controls so that they return null, hence disabling the filter
            $(':input[type="checkbox"]', this).attr("checked",false);
            $(':input[type!="checkbox"]', this).val("");
            $("select", this).prop("selectedIndex",0);
            $(':input',this).trigger('change');
        }
    });  

    /// FILTER STUFF
    //handle filtering 
    //The parent element should have the .control-on-change-filter class as well as any other options.
    //The input element should be the only input element in the parent.
    //The parent element can have special attirbutes to hint about the type of filtering we want:
    //When no special attribute is set, return all records that contain the string.
    //When _filterMatch is set on the parent, the value should match exactly.
    //When _filterGt is set, filter on values that are greater than or equal to it.
    //When _filterLt is set, filter on values that are less than or equal to.
    $(".control-on-change-filter", context).on('change keypress paste focus textInput input', ':input', function()
    {

        //element to look in for the attributes:
        var attribute_element;
        if ($(this).hasClass("control-on-change-filter"))
            attribute_element=$(this);
        else
            attribute_element=$(this).closest(".control-on-change-filter");


        //get the value via the correct data conversion routines:
        var key_str=attribute_element.attr("_key");
        var meta=resolveMeta(key_str, this_control.meta.meta);
        console.log(key_str, this_control.meta.meta);
        var get_element=$(".field-get", attribute_element);
        var value=dataConv[meta.type]['get'](get_element, meta, key_str);

        console.log("get_element, keystr, meta, value" , get_element, key_str, meta, value);

        if (value!=null)
            attribute_element.addClass("control-filter-active");
        else
            attribute_element.removeClass("control-filter-active");

        //look if there are any other filters active under the control-on-filter-highlight element, to determine
        //if we still need to highlight it.
        if ((attribute_element.hasClass("control-filter-active") || attribute_element.closest(".control-on-filter-highlight").find(".control-filter-active").length!=0))
            attribute_element.closest(".control-on-filter-highlight").addClass("ui-state-highlight control-filter-highlight");
        else
            attribute_element.closest(".control-on-filter-highlight").removeClass("ui-state-highlight control-filter-highlight");


        if (!this_control.params.get_params.spec)
            this_control.params.get_params.spec={};

        if (!this_control.params.get_params.spec[key_str])
            this_control.params.get_params.spec[key_str]={};

        var changed=false;

        //simple exact match?
        if (attribute_element.attr("_filterMatch")=="")
        {
            if (value!=this_control.params.get_params.spec[key_str])
            {
                if (value==null)
                    delete(this_control.params.get_params.spec[key_str])
                else
                    this_control.params.get_params.spec[key_str]=value;
                changed=true;
            }
        }
        //advanced querys:
        else 
        {
            var changed_filters={};

            if (attribute_element.attr("_filterGte")=="")
                changed_filters["$gte"]=value;
            else if (attribute_element.attr("_filterLte")=="")
                changed_filters["$lte"]=value;
            else if (attribute_element.attr("_filterIn")=="")
                changed_filters["$in"]=value;
            else 
            //default to a case insensitive regex match:
            {
                changed_filters["$regex"]=value;
                changed_filters["$options"]="i";
            }

            //delete the changes, since its null now?
            if (value==null)
            {
                $.each(changed_filters, function(k,v)
                {
                    if (k in this_control.params.get_params.spec[key_str])
                    {
                        changed=true;
                        delete(this_control.params.get_params.spec[key_str][k]);
                    }
                });
            }
            else
            //add/overwrite values
            {

                //make sure its a object:
                // if (typeof this_control.params.get_params.spec[key_str] != "object")
                //     this_control.params.get_params.spec[key_str]={};

                $.each(changed_filters, function(k,v)
                {
                    if (this_control.params.get_params.spec[key_str][k]!=v)
                    {
                        this_control.params.get_params.spec[key_str][k]=v
                        changed=true;
                    }
                });
            }

            //delete the entry if its empty
            if ($.isEmptyObject(this_control.params.get_params.spec[key_str]))
            {
                delete (this_control.params.get_params.spec[key_str]);
            }
        }


         if (changed)
            this_control.get_delayed(false);

    });
    


    //set default focus
    $(".controlSetFocus", context).focus();

    //enable endless scrolling?
    if (this_control.params.endless_scrolling && ('limit' in getParams))
    {
        var endlessUpdating=false;
        $(context).on("view.scrolledBottom",function()
        {
            if (endlessUpdating)
                return;
            
            endlessUpdating=true;
            
            var endlessParams={};
            $.extend( endlessParams, getParams );
            
            if (!('offset' in endlessParams))
                endlessParams.offset=0;
            
            endlessParams.offset+=$(list_source_element).parent().children().length-beginLength;
            
            logDebug("endless scroll offset is ",endlessParams.offset);

            rpc(
                params.getData,
                endlessParams,
                function(result)
                {
                    dataConv.List.put(
                            list_source_element, //element
                            { meta: meta },         //meta
                            '',                     //keyStr
                            result.data,            //value 
                            {                       //settings
                                noRemove: true
                            }       
                    );
                    endlessUpdating=false;
                },
                this.debug_txt+"list getting data (scrolling)"
            );
        });
    }

}



/*

function controlList(params)
{
    var meta={};
    var context=$("#"+params.view.id);
    var field-list-source_element=$(".field-list-source:first",context);
    var beginLength=field-list-source_element.parent().children().length;

    this.debug_txt=params.view.id+" "+params.view.name+" ";

    ////// GENERIC LIST STUFF
    
    //getParams can be changed by clicking sort colums, and by search queries etc
    var getParams={};
    if (params.getDataParams)
        getParams=jQuery.extend(true, {}, params.getDataParams); 
    
    var edit=function(event)
    {
        var listParent=$(this).closest(".autoListItem[_index], .field-list-source[_index]",context)    ;
        
        var element=$(this);
        var id=listParent.attr("_id");
        var index=listParent.attr("_index");
        element.addClass("ui-state-highlight");
        
        
        //create the view to edit the clicked item
        var editView={};
        $.extend( editView, params.editView );
        if (! editView.params)
            editView.params={};
        editView.focus=$(element).autoFindKeys(meta);
        if (typeof id != "undefined")
            editView.params[index]=id;
        editView.x=event.clientX;
        editView.y=event.clientY;
        viewCreate(
            {
                creator: element
            },
            editView);
    };

    var del=function(event)
    {
        var listParent=$(this).closest(".autoListItem",context);
        var id=listParent.attr("_id");
        var index=listParent.attr("_index");

        $(this).confirm(function()
        {
            var rpcParams={};
            rpcParams[index]=id;
            rpc(
                params.delData,
                rpcParams,
                function(result)
                {
                    if (!viewShowError(result, listParent, meta))
                    {
                        $(".view").trigger('refresh');
                    }
                },
                this.debug_txt+"list deleting item"
            );
        });
    };

    function getData(update)
    {

        //get data
        rpc(
            params.getData,
            getParams,
            function(result)
            {
                viewShowError(result, context, meta);
            
                if ('data' in result)
                {
                    dataConv.List.put(
                            field-list-source_element, //element
                            { meta: meta },         //meta
                            '',                     //keyStr
                            result.data,            //value 
                            {                       //settings
                                update: update,
                                showChanges: update
                            }       
                    );
                }
                
                $(".control-on-click-del", context).unbind('click');
                $(".control-on-click-del", context).click( del);
                $(".control-on-click-edit", context).unbind( 'click');
                $(".control-on-click-edit", context).click( edit);

                if (!update)
                {
                    params.loadCallback(result);
                }
            },
            this.debug_txt+"list getting data, update="+update
        );
    }

    $(context).bind('refresh',function()
    {
        //console.log("reresh!!");
        getData(true);

    });

    //get meta
    rpc(
        params.getMeta,
        params.getMetaParams,
        function(result)
        {
            if (!viewShowError(result, context, meta))
            {
                meta=result['data'];
                //add real input to autoMeta divs. 
                $(context).autoMeta(meta);
                
                //make sure autoListItems are recognised (normally autoMeta does this when it encounters and array or hash type)
    //          $(".field-list-source:first", context).addClass("autoListItem");
                
                getData(false);
            }
        },
        this.debug_txt+"list getting meta data"     

    )

    
    /// ORDER STUFF
    
    //what is the current selected sorting column?
    if ($(".control-order-asc",context).length !=0)
    {
        getParams.sort={};
        getParams.sort[$(".control-order-asc").attr("_key")]=1;
    }
    else if ($(".control-order-desc",context).length !=0)
    {
        getParams.sort={};
        getParams.sort[$(".control-order-desc").attr("_key")]=-1;
    }

    $(".control-on-click-order", context).click(function()
    {
        getParams.sort={};
        
        if ($(this).hasClass("control-order-asc"))
        {
            $(".control-order-asc",context).removeClass("control-order-asc");
            $(".control-order-desc",context).removeClass("control-order-desc");
            getParams.sort[$(this).attr("_key")]=-1;
            $(this).addClass("control-order-desc");
        }
        else
        {
            $(".control-order-asc",context).removeClass("control-order-asc");
            $(".control-order-desc",context).removeClass("control-order-desc");
            getParams.sort[$(this).attr("_key")]=1;
            $(this).addClass("control-order-asc");
        }
        
        getData(false);
    });
    

    /// FILTER STUFF
    //handle filtering 
    $(".control-on-change-filter", context).keyup(function()
    {
        filterPrevious=$(this).val();
        
        if (!getParams.filter)
            getParams.filter={};
        
        if ($(this).val()!="")
        {
            if (getParams.filter[$(this).attr("_key")]==$(this).val())
                return;
            
            getParams.filter[$(this).attr("_key")]=$(this).val();
            getData(false);
        }
        else
        {
            if (!($(this).attr("_key") in getParams.filter))
                return;
            
            delete getParams.filter[$(this).attr("_key")];
            getData(false);
        }
    });
    
    //set default focus
    $(".controlSetFocus", context).focus();

    //enable endless scrolling?
    if (params.endlessScrolling && ('limit' in getParams))
    {
        var endlessUpdating=false;
        $(context).on("view.scrolledBottom",function()
        {
            if (endlessUpdating)
                return;
            
            endlessUpdating=true;
            
            var endlessParams={};
            $.extend( endlessParams, getParams );
            
            if (!('offset' in endlessParams))
                endlessParams.offset=0;
            
            endlessParams.offset+=$(field-list-source_element).parent().children().length-beginLength;
            
            logDebug("endless scroll offset is ",endlessParams.offset);

            rpc(
                params.getData,
                endlessParams,
                function(result)
                {
                    dataConv.List.put(
                            field-list-source_element, //element
                            { meta: meta },         //meta
                            '',                     //keyStr
                            result.data,            //value 
                            {                       //settings
                                noRemove: true
                            }       
                    );
                    endlessUpdating=false;
                },
                this.debug_txt+"list getting data (scrolling)"
            );
        });
    }
            
}

*/