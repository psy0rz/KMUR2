//////////////////////////////////////////////////////////////////////////////////////////
//base-class for all controllers


/* 
Contrary to fields.js, we DO intent to emultate classes by using javascript prototyping. A control-class will
be instantiated and will have lots of member variables that contain parameters and retrieved meta-data.

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

    edit_view            View that is opened when a user clicks an element with class .control-on-click-edit

Other items in params documented in the subclasses below.

*/
function ControlBase(params)
{
    //constructor
    this.params={};
    $.extend( true, this.params, params);

    this.context=$("#"+params.view.id);
    this.debug_txt=params.view.id+" "+params.view.name+" ";

    if (!('get_meta' in this.params))
        this.params.get_meta=this.params.class+".get_meta";

    if (!('get_meta_params' in this.params))
        this.params.get_meta_params=this.params.view.params;

    if (! this.params.get_meta_result)
        this.params.get_meta_result=function(){};


    if (!('get' in this.params))
        this.params.get=this.params.class+".get";

    if (!('get_params' in this.params))
        this.params.get_params=this.params.view.params;

    if (! this.params.get_result)
        this.params.get_result=function(){};

    if (!('title' in this.params))
        this.params.title="Edit item {_id}";

    if (!('delete' in this.params))
        this.params.delete=this.params.class+".delete";

    if (!('delete_params' in this.params))
        this.params.delete_params=this.params.view.params;



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
        if (data != undefined && key in data)
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
    create_ok            called when putting a new item went ok. use this to call a new view after creating somehting.

    close_after_save     close the view after succesfully saving the data

    delete_result        called with results of del

    title_new            title for new items

    favorite_menu       up on openening and saving add/upate favorite to specified menu.
    favorite_key         the result-key to use as favorite identifier (defaults to _id)

    on_change           what to do when our class changes:
                            null: dont do anything, to prevent losing data (default)
                            get:  re-get the data from the server. also gives feedback to the user
                            reload: re-load the whole view

*/
function ControlForm(params)
{
    ControlBase.call(this,params);


    if (!('close_after_save' in this.params))
        this.params.close_after_save=true;

    if (!('put' in this.params))
        this.params.put=this.params.class+".put";

    if (!('put_params' in this.params))
        this.params.put_params=this.params.view.params;

    if (! this.params.put_result)
        this.params.put_result=function(){};

    if (! this.params.create_ok)
        this.params.create_ok=function(){};

    if (! this.params.delete_result)
        this.params.delete_result=function(){};

    if (! this.params.favorite_key)
        this.params.favorite_key='_id';

    if (!('title_new' in this.params))
        this.params.title_new="New item";

    this.get_meta({});
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

ControlForm.prototype.get=function(request_params)
{
    //its not possible to 'get' data from a form when there are no get_parameters. 
    //this is the case when the user wants to create a new item instead of editting an existing one
    if (this.params.get_params==undefined || Object.keys(this.params.get_params).length==0)
    {
        //NOTE:not getting data,  but we still call get_result with an empty result to handle the rest of the stuff
        this.get_result({}, request_params);
    }
    else
    {
        //if we do have usefull get-parameters, just let the base class handle it
        ControlBase.prototype.get.call(this, request_params);
    }
}


ControlForm.prototype.get_result=function(result, request_params)
{
    this.params.get_result(result, request_params);

    // $(".control-on-click-save", this.context).prop("disabled", false);
    if (('data' in result) && (result.data != null) )
    {
        this.new_item=false;

        Field.Dict.put('', this.meta, this.context, result.data, request_params)

        if (this.params.favorite_menu)
        {
//            $(document).trigger('menu.put_favorite', {
            $.event.trigger('menu_put_favorite', {
                'menu':      this.params.favorite_menu,
                'title':     this.format(this.params.title, result.data),
                'view':      this.params.view,
                'favorite_id': result.data[this.params.favorite_key]
            });
        }

        viewReady({
            'view': this.params.view,
            'title': this.format(this.params.title, result.data)
        });

        $(".control-hide-on-edit", this.context).hide();
    }
    //its a new item
    else
    {
        this.new_item=true;

        viewReady({
            'view': this.params.view,
            'title': this.params.title_new
        });


        $(".control-hide-on-new", this.context).hide();
    }

    viewShowError(result, this.context, this.meta);

    //assume it has been deleted/become inaccesible, so delete the favorite, if the key is in the view params.
    if ('error' in result && this.params.favorite_menu && (this.params.favorite_key in this.params.view.params))
    {
        console.log("deleting stale entry from favorites menu");
//        $(document).trigger('menu.delete_favorite', {
        $.event.trigger('menu_delete_favorite', {
            'menu':      this.params.favorite_menu,
            'favorite_id': this.params.view.params[this.params.favorite_key]
        });
    }
    
    this.focus();
}


ControlForm.prototype.attach_event_handlers=function()
{
    var this_control=this;
    var context=this.context;

 

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

    //some forms are just showing data or are readonly. in those cases there usually will be some edit-button or elements to click.
    $(".control-on-click-edit", context).off().click(function(event)
    {

        var element=$(this);
    
        //create the view to edit the clicked item
        var editView={};
        $.extend( editView, this_control.params.edit_view );
        if (! editView.params)
            editView.params={};


        //determine focus field:
        editView.focus=Field.Base.keys($(this).attr("field-key"));
        editView.x=event.clientX;
        editView.y=event.clientY;
 

        viewCreate(
            {
                creator: $(this)
            },
            editView);
    });


    //some  control changed/added an item in our class, so update the form
    $(context).on(this.params.class+'_changed', function(e,result)
    { 
        if (this!=e.target)
            return false;

        console.log("form: data on server has changed",this_control);

        //reload the whole view
        if (this_control.params.on_change=='reload')
        {
            viewLoad(this_control.params.view);
        }
        //re-get the data and show changes
        else if (this_control.params.on_change=='get')
        {
            this_control.get({ show_changes: true });
        }

        return(false);
    });

    //a control deleted something in our class
    $(context).on(this.params.class+'_deleted', function(e,result)
    { 
        if (this!=e.target)
            return false;

        //NOTE: we just assume we can compare the _id here. maybe we should make this more generic?
        if (result.data._id == this_control.params.view.params._id && this_control.params.view.params._id!=undefined)
        {
            console.log("form: data on server got deleted",this_control);
            viewClose(this_control.params.view);
        }

        //sometimes stuff gets deleted by edit forms, which themselfs do not update favorites. 
        //so in that case we can do it for them.
        if (this_control.params.favorite_menu && (this_control.params.favorite_key in result.data))
        {
            console.log("deleting entry from favorites menu");
//            $(document).trigger('menu.delete_favorite', {
            $.event.trigger('menu_delete_favorite', {
                'menu':      this_control.params.favorite_menu,
                'favorite_id': result.data[this_control.params.favorite_key]
            });
        }

        return(false);
    });

}


//focus the correct input field
ControlForm.prototype.focus=function()
{
    if (this.params.view && this.params.view.focus)
        Field[this.meta.type].find_element('', this.meta, this.context, this.params.view.focus).focus();
    else if (this.params.default_focus)
        Field[this.meta.type].find_element('', this.meta, this.context, this.params.default_focus).focus();
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

    //no errors?
    if (!viewShowError(result, this.context, this.meta))
    {

        if (this.params.close_after_save)
            viewClose(this.params.view);

        //broadcast a changed-event to update all the views, except ourselfs
//      $(".view").not(this.context).trigger(this.params.class+'.changed', result);
        $.event.trigger(this.params.class+'_changed', result);

        if (this.params.favorite_menu)
        {
            var menu_view={};
            $.extend(menu_view, this.params.view);
            menu_view.params[this.params.favorite_key]=result.data[this.params.favorite_key];

//          $(document).trigger('menu.put_favorite', {
            $.event.trigger('menu_put_favorite', {
                'menu':      this.params.favorite_menu,
                'title':     this.format(this.params.title, result.data),
                'view':      menu_view,
                'favorite_id': result.data[this.params.favorite_key]
            });
        }

        if (this.new_item==true)
            this.params.create_ok(result, request_params);
    }
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
        if (this.params.close_after_save)
        {
            //console.error("closing dah shit", this.params.view);
            viewClose(this.params.view);
        }

        //broadcast the deleted event to update other views
//        $(".view").not(this.context).trigger(this.params.class+'.deleted', result);
        $.event.trigger(this.params.class+'_deleted', result);

        if (this.params.favorite_menu)
        {
//            $(document).trigger('menu.delete_favorite', {
            $.event.trigger('menu_delete_favorite', {
                'menu':      this.params.favorite_menu,
                'favorite_id': result.data[this.params.favorite_key]
            });
        }
    }
}


//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//list controller
/*
params:
    (look in the baseclass for the basic documentation)
    

    get:                rpc-call to get data, if not specified will be set to class.get_all

    endless_scrolling:  set to true to activate endless scrolling. 
                        (by default get_params.limit will be set to 25 but you can specify a different value)

    favorite_menu       up on openening and saving add/upate favorite to specified menu.
    favorite_key        the result-key to use as favorite identifier (defaults to _id)

    on_change           what to do when our class changes:
                            put: only put the new data into the list. ignores sorting and filtering, but gives best feedback to user (default)
                            get: re-get the list, honoring sorting and filtering settings
                            reload: re-load the whole view

*/
function ControlList(params)
{

    ControlBase.call(this, params);

    if (!('get' in params))
        this.params.get=this.params.class+".get_all";

    if (! this.params.favorite_key)
        this.params.favorite_key='_id';

    if (! this.params.on_change)
        this.params.on_change='put';

    if (typeof (this.params.get_params) ==='undefined')
        this.params.get_params={};

    if (this.params.endless_scrolling)
    {
        if (!('limit' in this.params.get_params))
            this.params.get_params.limit=25;

        this.params.get_params.skip=0;
    }

    this.list_source_element=$(".field-list-source:first", this.context);
    console.log("list_source_element=", this.list_source_element);
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

    Field[this.meta.type].meta_put('',this.meta, this.context);

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
//        console.error("updateing", request_params);
        Field.List.put(
            '',
            this.meta,
            this.list_source_element,
            result.data,
            request_params
        );

        if (this.params.endless_scrolling)
        {
            //console.log("checking", result.data.length, $(window).scrollTop(), $(document).scrollTop());
            //we dont have enough items to overflow the window enough, and there are still items left on the server?
            if  ( 
                    ($(window).height()*2)+$(window).scrollTop() > $(document).height() && 
                    result.data.length>=this.params.get_params.limit
                )
            {
                this.params.get_params.skip+=this.params.get_params.limit;
                logDebug("endless scroll getting more data because document height is not reached yet ", this.params.get_params.skip);
                this.get_delayed({
                    list_no_remove: true,
                    list_update: true
                });
            }
        }
    }


    if (!this.view_ready)
    {
        viewReady({
            'view': this.params.view,
            'title': this.format(this.params.title, result.data)
        });
        this.view_ready=true;

        this.focus();

    }

}

//focus the correct input field, for a list is this diffent than for a form. 
ControlList.prototype.focus=function()
{
    if (this.params.view && this.params.view.focus)
        Field[this.meta.meta.type].find_element('', this.meta.meta, this.context, this.params.view.focus).focus();
    else if (this.params.default_focus)
        Field[this.meta.meta.type].find_element('', this.meta.meta, this.context, this.params.default_focus).focus();
    else
        $(".control-default-focus", this.context).focus();
}


//TODO: just handle this in get_meta_result
ControlList.prototype.attach_event_handlers=function()
{   
    var this_control=this;
    var context=this.context;

    //some  control changed/added an item in our class, so update the list
    $(context).on(this.params.class+'_changed', function(e,result)
    { 
        if (this!=e.target)
            return false;

        console.log("list: data on server has changed",this_control);

        //reload the whole view
        if (this_control.params.on_change=='reload')
        {
            viewLoad(this_control.params.view);
        }
        //re-get the data
        else if (this_control.params.on_change=='get')
        {
            //reset scrolling
            if (this_control.params.endless_scrolling)
                this_control.params.get_params.skip=0;

            this_control.get_delayed({});
        }
        //only put the new data into the list
        else if (this_control.params.on_change=='put')
        {
            Field.List.put(
                this_control.list_source_element.attr("field-key"),
                this_control.meta,
                this_control.list_source_element,
                [ result.data ],
                {
                    list_no_remove: true,
                    list_update: true,
                    show_changes: true

                }
            );
        }

        return(false);
    });

    //some control (or maybe this control) deleted an item in our class, so update the list
    $(context).on(this.params.class+'_deleted', function(e, result)
    {
        if (this!=e.target)
            return false;

        console.log("list: data on server has been deleted", this_control);

        var key=result.data[this_control.meta.list_key];
        var element=Field.List.find_element(
            this_control.list_source_element.attr("field-key"),
            this_control.meta,
            this_control.list_source_element,
            [ key ]
        );

        element.hide(1000, function()
        {
            element.remove();
        });

        return(false);
    });
 


    //delete the element, after confirmation
    $(".control-on-click-del", context).off().click(function(event)
    {
        var list_id=Field.List.from_element_get_id(this_control.list_source_element.attr("field-key"), this);

        if (list_id===undefined)
            return;

        $(this).confirm(function()
        {
            var rpc_params={};
            rpc_params[this_control.meta.list_key]=list_id;
            rpc(
                this_control.params.delete,
                rpc_params,
                function(result)
                {
                    if (!viewShowError(result, this_control.context, this_control.meta))
                    {
//                        $(".view").not(this.context).trigger(this_control.params.class+'.deleted', result);
                        $.event.trigger(this_control.params.class+'_deleted', result);

                        if (this_control.params.favorite_menu)
                        {
//                            $(document).trigger('menu.delete_favorite', {
                            $.event.trigger('menu_delete_favorite', {
                                'menu':      this_control.params.favorite_menu,
                                'favorite_id': result.data[this_control.params.favorite_key]
                            });
                        }
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
            this_control.params.get_params.sort[$(this).attr("field-key")]=1;
        });
        $(".control-order-desc",context).each(function()
        {
            this_control.params.get_params.sort[$(this).attr("field-key")]=-1;
        });

        //reset scrolling
        if (this_control.params.endless_scrolling)
            this_control.params.get_params.skip=0;
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
        this_control.get_delayed({});
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

    //When filter-match is set on the parent, filter on items that exactly match the value
    //When filter-gte is set, filter on items that are greater than or equal to the value
    //When filter-lte is set, filter on items that are less than or equal to the value
    //When filter-in is set, filter on items that match any of the values (used with multiselect filtering)
    $(".control-on-change-filter", context).on('change keypress paste focus textInput input', ':input', function()
    {

        //element to look in for the attributes:
        var attribute_element;
        if ($(this).hasClass("control-on-change-filter"))
            attribute_element=$(this);
        else
            attribute_element=$(this).closest(".control-on-change-filter");


        //get the value via the correct data conversion routines:
        var key_str=attribute_element.attr("field-key");
        var keys=Field.Base.keys(key_str);

        console.log("resorlving", key_str, this_control.meta.meta);
        var meta=Field[this_control.meta.meta.type].resolve_meta(this_control.meta.meta, keys);
        console.log(key_str, meta);

        var get_element=$(".field-get", attribute_element);
        var value=Field[meta.type].get(key_str, meta, get_element);

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
        if (attribute_element.attr("filter-match")=="")
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

            //greather-than-or-equal
            if (attribute_element.attr("filter-gte")=="")
                changed_filters["$gte"]=value;
            //less-than-or-equal
            else if (attribute_element.attr("filter-lte")=="")
                changed_filters["$lte"]=value;
            //value is IN specified value-array (used with multiselect filtering)
            else if (attribute_element.attr("filter-in")=="")
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
        {
            //reset scrolling
            if (this_control.params.endless_scrolling)
                this_control.params.get_params.skip=0;

            this_control.get_delayed({});
        }

    });
    
    //generic regex_or filter to do quick searches in multiple fields 
    $(".control-on-change-search", context).on('change keypress paste textInput input', function()
    {
        var search_txt=$(this).val();

        if (this_control.last_search_txt==search_txt)
            return;

        this_control.last_search_txt=search_txt;

        if (!this_control.params.get_params.regex_or)
            this_control.params.get_params.regex_or={};

        if (search_txt=="")
        {
            delete this_control.params.get_params.regex_or;
            $(this).removeClass("ui-state-highlight");
        }
        else
        {
            var search_keys=$(this).attr("control-search-keys").split(" ");

            $(this).addClass("ui-state-highlight");

            $.each(search_keys, function(i, key_str)
            {
                this_control.params.get_params.regex_or[key_str]=search_txt;

            });

        }

        if (this_control.params.endless_scrolling)
            this_control.params.get_params.skip=0;

        this_control.get_delayed({});

    });

    //enable endless scrolling?
    if (this_control.params.endless_scrolling)
    {
        $(context).on("view.scrolledBottom",function()
        {
            this_control.params.get_params.skip+=this_control.params.get_params.limit;
            //NOTE: maybe we should create a small overlap to allow for deleted items on the server?
            logDebug("endless scroll skip is ", this_control.params.get_params.skip);
            this_control.get_delayed({
                list_no_remove: true,
                list_update: true
            });
        });
    }

}



