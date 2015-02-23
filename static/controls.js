//////////////////////////////////////////////////////////////////////////////////////////
//base-class for all controllers


/* 
Contrary to fields.js, we DO intent to emultate classes by using javascript prototyping. A control-class will
be instantiated and will have lots of member variables that contain parameters and retrieved meta-data.

params:
    view:                view to operate on. view.id is used in combination with context, to determine the jquery this.context object.
    context:             selector for a sub-context to operate on. this way you can use multiple controls in 1 view.             
    class:               rpc-class-name to call (used to fill in default values)

    get_meta:            rpc-method called to get metadata (default: class+".get_meta")
    get_meta_params      parameters to pass to get_meta (default: view.params)
    get_meta_result      called with results of get_meta

    get:                 rpc-method called to get data (default: class+".get")
    get_params           parameters to pass to get 
    get_result           called with results of get data 
    title:               title to set after get. (will be processed by format(..,result))

    delete:              rpc-method called to delete data (default: class+".delete")
    delete_params        parameters to pass to put (default: same as get_params)

    create_view_params      parameters passed to new views created by this control

Other items in params documented in the subclasses below.

*/
function ControlBase(params)
{
    //constructor
    this.params={};

    //not that this wont copy keys that are null or undefined, which is important when creating new items
    $.extend( true, this.params, params);

    if (params.context)
        this.context=$(params.context, "#"+params.view.id);
    else
        this.context=$("#"+params.view.id);

    if (this.context.length==0)
    {
        console.error("Cant get context", this.context);
        return(false);
    }

    if (this.context.closest(".view-disabled").length!=0)
    {
        console.debug("View is disabled, not doing anything.", this);
        return(false);
    }


    this.debug_txt=params.view.id+" "+params.view.name+" ";

    if (!('get_meta' in this.params))
        this.params.get_meta=this.params.class+".get_meta";

    if (!('get_meta_params' in this.params))
        this.params.get_meta_params=this.params.view.params;

    if (! this.params.get_meta_result)
        this.params.get_meta_result=function(){};


    if (!('get' in this.params))
        this.params.get=this.params.class+".get";

    // if (!('get_params' in this.params))
    //     this.params.get_params={}; //too ambigious: this.params.view.params;

    if (! this.params.get_result)
        this.params.get_result=function(){};

//    if (!('title' in this.params))
//        this.params.title="Edit item {_id}";

    if (!('delete' in this.params))
        this.params.delete=this.params.class+".delete";

    if (!('delete_params' in this.params))
        this.params.delete_params=this.params.get_params;


    if (!('create_view_params' in this.params))
        this.params.create_view_params={}

    return(true);
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

/**
 Substitute macros found in text with data, and disable translating.

 txt is assumed to be SAFE, so this should NOT be userinput! (because of html injection attacks)

 data is assume to be unsafe userinput.

 Example: format("your name is {name}", { 'name': 'foobs' })
 Returns: "<span>your name is <span class='notranslate'>foobs</span></span>"
*/
ControlBase.prototype.format_notranslate=function(txt, data)
{
    var key;
    var ret=txt;

    //first replace all {} by spans (no substituting to prevent html injects)
    while(matches=ret.match(/\{\w*\}/))
    {
        key=matches[0].substr(1,matches[0].length-2);
        ret=ret.replace(matches[0], "<span class='notranslate'>"+key+"</span>");
    }

    //translate into actual jquery html element
    ret=$("<span>"+ret+"</span>");

    //now substitude data in a safe manner:
    $("span",ret).each(function(){
        var key=$(this).text();
        if (key in data)
            $(this).text(data[key]);
    });

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



ControlBase.prototype.attach_event_handlers=function()
{
    var this_control=this;
    var context=this.context;

    //create a handler to open a view
    $(".control-on-click-view",context).off("click").click(function(event)
    {
        var editView={};

        editView.x=event.clientX;
        editView.y=event.clientY;

        editView.focus=Field.Base.from_element_get_data_keys($(this));

        var attribute_element;
        if ($(this).attr("control-view"))
            attribute_element=$(this);
        else
            attribute_element=$(this).closest("[control-view]");

        editView.name=attribute_element.attr("control-view");
        editView.mode=attribute_element.attr("control-view-mode");

        editView.params=this_control.params.create_view_params;
        // if (attribute_element.attr("control-view-pass-get-params")=="")
        //     $.extend( editView.params, this_control.params.get_params );


        if (!editView.name)
        {
            console.error("No view specified. Use control-view attribute to specifiy view that should be opened. (you also can specify it in a parent)");
            return(false);
        }

        if (!editView.mode)
            editView.mode="main";

        viewCreate(
            {
                //NO, this confuses lists: creator: $(this)
            },
            editView);

        return(false);
    });

}

//////////////////////////////////////////////////////////////////////////////////////////
//form controller
/*
params:
    (look in the baseclass for the basic documentation)


    put:                 rpc-method called to put data (default: class+".delete")
    put_params           parameters to pass to put (default: get_params)
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
                            put: put the data into the form. (cant verify if the data actually belongs to the form!)
                            reload: re-load the whole view

    default             default values to put before putting actual data.

    field_put           called after putting the data to the form fields. 
                        for existing forms the data is the get_result, for new forms its the default variable.
                        this is also triggered on change-events.
                        parameters only contain data (unlike the get_result function which is called with complete rpc-results including errors)

*/
function ControlForm(params)
{
    if (!ControlBase.call(this,params))
        return(false);


    if (!('close_after_save' in this.params))
        this.params.close_after_save=true;

    if (!('put' in this.params))
        this.params.put=this.params.class+".put";

    if (!('put_params' in this.params))
        this.params.put_params=this.params.get_params;

    if (! this.params.put_result)
        this.params.put_result=function(){};

    if (! this.params.field_put)
        this.params.field_put=function(){};

    if (! this.params.create_ok)
        this.params.create_ok=function(){};

    if (! this.params.delete_result)
        this.params.delete_result=function(){};

    if (! this.params.favorite_key)
        this.params.favorite_key='_id';

//    if (!('title_new' in this.params))
//        this.params.title_new="New item";

    this.get_meta({});

    return(true);
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
    Field[this.meta.type].meta_put('',this.meta, this.context, {});

    this.attach_event_handlers();


    this.get(request_params);

}

ControlForm.prototype.get=function(request_params)
{
//    console.log(this.params.get_params);
    //its not possible to 'get' data from a form when there are no get_parameters specified.
    //unless get_parmas is explicitly undefined.
    if (this.params.get_params!=undefined && Object.keys(this.params.get_params).length==0)
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

//put data into the fields of the current form
ControlForm.prototype.field_put=function(data, options)
{
    // console.error("FIELD_PUT", data, options);
    Field.Dict.put('', this.meta, this.context, data, options);
    this.params.field_put(data, options);

}

ControlForm.prototype.get_result=function(result, request_params)
{
    this.params.get_result(result, request_params);


    // $(".control-on-click-save", this.context).prop("disabled", false);
    if (('data' in result) && (result.data != null) )
    {
        this.new_item=false;

        this.field_put(result.data, request_params);

        if (this.params.favorite_menu)
        {
//            $(document).trigger('menu.put_favorite', {
            $.publish('menu_put_favorite', {
                'menu':      this.params.favorite_menu,
                'title':     this.format(this.params.favorite_title, result.data),
                'view':      this.params.view,
                'favorite_id': result.data[this.params.favorite_key]
            });
        }

        if (this.params.title)
        {
            viewReady({
                'view': this.params.view,
                'title': this.format_notranslate(this.params.title, result.data)
            });
        }

        $(".control-hide-on-edit", this.context).hide();
        if (this.context.hasClass("control-hide-on-edit"))
            this.context.hide();
    }
    //its a new item
    else
    {
        this.new_item=true;

        //fill in default values
        if (this.params.default)
        {
            //also highlight default values
            var sub_request_params={};
            $.extend(true, sub_request_params, request_params);
            sub_request_params.show_changes=true;
            sub_request_params.update=true;
            this.field_put(this.params.default, sub_request_params);
        }


        if (this.params.title_new)
        {
            viewReady({
                'view': this.params.view,
                'title': this.params.title_new
            });
        }

        $(".control-hide-on-new", this.context).hide();
        if (this.context.hasClass("control-hide-on-new"))
            this.context.hide();
    }

    viewShowError(result, this.context, this.meta);

    //assume it has been deleted/become inaccesible, so delete the favorite, if the key is in the view params.
    if ('error' in result && this.params.favorite_menu && (this.params.favorite_key in this.params.view.params))
    {
        console.log("deleting stale entry from favorites menu");
//        $(document).trigger('menu.delete_favorite', {
        $.publish('menu_delete_favorite', {
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

 
    ControlBase.prototype.attach_event_handlers.call(this);

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
        window.history.back();
    });


    //some  control changed/added an item in our class, so update the form
    $(context).subscribe(this.params.class+'.changed', "form", function(data)
    { 
        //not our data?
        //FIXME: we should look at list_key instead assuming its always _id.
        if (data._id!=this_control.params.get_params._id)
            return(false);

        //reload the whole view
        if (this_control.params.on_change=='reload')
        {
            console.log("ControlForm: data on server has changed, reloading view", this_control,data);
            viewLoad(this_control.params.view);
        }
        //re-get the data and show changes
        else if (this_control.params.on_change=='get')
        {
            console.log("ControlForm: data on server has changed, regetting data", this_control,data);
            this_control.get({ 
                show_changes: true,
                list_update: true 
            });
        }
        else if (this_control.params.on_change=='put')
        {
            console.log("ControlForm: data on server has changed, putting data", this_control,data);
            this_control.field_put(data, {
                show_changes:true,
                list_update: true
            });
            // Field.Dict.put('', this_control.meta, this_control.context, data, {
            //     show_changes:true,
            //     list_update: true
            // });
        }
        else
        {
            console.log("ControlForm: data on server has changed, ignoring", this_control,data);            
        }
        return(false);
    });

    //a control deleted something in our class
    $(context).subscribe(this.params.class+'.deleted', "form", function(data)
    { 
        //NOTE: we just assume we can compare the _id here. maybe we should make this more generic?
        if (data._id == this_control.params.view.params._id && this_control.params.view.params._id!=undefined)
        {
            console.log("form: data on server got deleted",this_control);
            window.history.back();
            
        }

        //sometimes stuff gets deleted by edit forms, which themselfs do not update favorites. 
        //so in that case we can do it for them.
        if (this_control.params.favorite_menu && (this_control.params.favorite_key in data))
        {
            console.log("deleting entry from favorites menu");
//            $(document).trigger('menu.delete_favorite', {
            $.publish('menu_delete_favorite', {
                'menu':      this_control.params.favorite_menu,
                'favorite_id': data[this_control.params.favorite_key]
            });
        }

        return(false);
    });

}


//focus the correct input field
ControlForm.prototype.focus=function()
{
    var element;
    if (this.params.view && this.params.view.focus)
        element=Field[this.meta.type].find_element('', this.meta, this.context, Field.Base.keys(this.params.view.focus));
    else if (this.params.default_focus)
        element=Field[this.meta.type].find_element('', this.meta, this.context, Field.Base.keys(this.params.default_focus));
    else
        element=$(".control-default-focus", this.context);

    if (element!=this.context && element.length)
    {
        $(':input', element).focus();
        element.focus();
    }
}


//get the currently filled in values from the form fields
ControlForm.prototype.field_get=function()
{
    return(Field.Dict.get('', this.meta, this.context));
}

//save the form data by calling the put rpc function
ControlForm.prototype.put=function(request_params)
{

    //are there put_params that we should COPY?
    var put_params={};
    if (this.params.put_params)
        put_params=jQuery.extend(true, put_params, this.params.put_params); //COPY, and not by reference!

    //get the data and store it into our local put_params
    put_params=jQuery.extend(true, put_params, this.field_get());

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
            window.history.back();

        //send a event to the creator of this view
        if (this.new_item)
            $(this.params.view.creator).trigger("control_form_created", result);
        else
            $(this.params.view.creator).trigger("control_form_changed", result);

        //broadcast a changed-event to everyone who is listening to it.
        // $.publish(this.params.class+'.changed', result);

        if (this.params.favorite_menu)
        {
            var menu_view={};
            $.extend(menu_view, this.params.view);
            menu_view.params[this.params.favorite_key]=result.data[this.params.favorite_key];

//          $(document).trigger('menu.put_favorite', {
            $.publish('menu_put_favorite', {
                'menu':      this.params.favorite_menu,
                'title':     this.format(this.params.favorite_title, result.data),
                'view':      menu_view,
                'favorite_id': result.data[this.params.favorite_key]
            });
        }

        if (this.new_item==true)
        {
            this.params.create_ok(result, request_params);
        }
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
            
            window.history.back();
        }

        //send a deleted-event to the creator of this view
        $(this.params.view.creator).trigger("control_form_deleted", result);

        //broadcast the deleted event to everyone who is listening
        // $.publish(this.params.class+'.deleted', result);

        if (this.params.favorite_menu)
        {
//            $(document).trigger('menu.delete_favorite', {
            $.publish('menu_delete_favorite', {
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
    endless_scrolling_minimum_skip: continue getting data until get_params.skip is at least this value. (mostly used internally on_change)

    scroll_context:     selector that specified context for endless scrolling. 
                        sometimes its usefull to use a parent or child of the normal context that scrolls. 
                        by default its set to the context.
                        note: this is not used "relative" in the current context or view, so be sure to specify it correctly.

    favorite_menu       up on openening and saving add/upate favorite to specified menu.
    favorite_key        the result-key to use as favorite identifier (defaults to _id)

    on_change           what to do when our class changes:
                            put: only put the new data into the list. 
                                 ignores sorting and filtering, but usually gives best feedback to user.
                                 ignores new items. 
                            putnew: same as put, but also adds new items. 
                            get: re-get the list, honoring sorting and filtering settings (default).
                                 can be annoying in some cases, since items might disappear when they're no longer in scope of the list.
                            reload: re-load the whole view. slow and annoying, but might be neccesary sometimes
    on_delete           what to do when an item in our class is deleted:
                            delete: removes the item from our list (default)
                            get: re-get the list, honoring sorting and filtering settings.
                                 can be annoying in some cases, since items might disappear when they're no longer in scope of the list.
                            reload: re-load the whole view. slow and annoying, but might be neccesary sometimes

no_start:         
    dont "start" the control by calling get_meta(). Usefull for derived controls like ControlListRelated

*/
function ControlList(params, no_start)
{

    if (!ControlBase.call(this, params))
        return(false);

    if (!('get' in params))
        this.params.get=this.params.class+".get_all";

    if (! this.params.favorite_key)
        this.params.favorite_key='_id';

    if (! this.params.on_change)
        this.params.on_change='get';

    if (! this.params.on_delete)
        this.params.on_delete='delete';

    if (typeof (this.params.get_params) ==='undefined')
        this.params.get_params={};

    if (this.params.endless_scrolling)
    {
        if (!('limit' in this.params.get_params))
            this.params.get_params.limit=25;

        this.params.get_params.skip=0;

        if (this.params.scroll_context)
            this.scroll_context=$(this.params.scroll_context);
        else
            this.scroll_context=this.context;
    }

    this.list_source_element=$(".field-list-source:first", this.context);
    //console.log("list_source_element=", this.list_source_element);
    this.list_begin_length=this.list_source_element.parent().children().length;

    this.view_ready=false;

    if (! no_start)
        this.get_meta({});

    return(true);
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

    Field[this.meta.type].meta_put('',this.meta, this.context, {});


    this.attach_event_handlers();
    this.get(request_params);
}



//this one only calls this.get, if its not already busy getting data.
//otherwise just sets a flag, so that get_result will call get again as soon as its done.
//this way multiple calls are not queued and not executed in parallel. (which is nice for for ordering and filtering)
ControlList.prototype.get_delayed=function(request_params)
{

    if (this.params.endless_scrolling)
    {
        if (request_params.list_continue)
            this.params.get_params.skip+=this.params.get_params.limit;
        else
        {
            this.params.get_params.skip=0;

            //when "resetting" the list, we also reset the minimum_skip option to prevent getting all the data when it isnt neccesary
            if (!request_params.list_no_remove)
                this.params.endless_scrolling_minimum_skip=0; 

        }
    }

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
        // console.error("updateing", JSON.stringify(request_params));
        Field.List.put(
            '',
            this.meta,
            this.list_source_element,
            result.data,
            request_params
        );

        // console.error("get_result list", this.context);
        //get more endless scroll-data only if enabled and when we're visible
        if (this.params.endless_scrolling && this.context.closest(".view").css("display")!="none")
        {
            var scroll_height=$(this.scroll_context).prop('scrollHeight');
            var height=$(this.scroll_context).height();

            if  ( 
                    ( scroll_height< height*2 ||  //not fully filled?   
                      this.params.get_params.skip<this.params.endless_scrolling_minimum_skip //not reached minimum_skip yet
                    )
                    && 
                    result.data.length>=this.params.get_params.limit //more data available?
                )
            {
                console.debug("endless scroll getting more data because height or minimum skip is not reached yet ", this.params.get_params.skip);
                this.get_delayed({
                    list_no_remove: true,
                    list_update: true,
                    list_continue: true
                });
            }
        }

        
        if (!this.getting)
        {
            //we're done getting all the data we need. now its safe to delete any list items that where marked for deleting when we started
            // console.error("deleting old list items", this.context);
            $('.field-list-delete', this.context).removeClass("field-list-delete field-list-item").hide(1000, function()
            {
                $(this).remove();
            });
        }

    }


    if (!this.view_ready)
    {
        if (this.params.title)
        {
            viewReady({
                'view': this.params.view,
                'title': this.format_notranslate(this.params.title, result.data)
            });
        }
        this.view_ready=true;

        this.focus();

    }


}

//focus the correct input field, for a list is this diffent than for a form. 
ControlList.prototype.focus=function()
{
    if (this.params.view && this.params.view.focus)
        Field[this.meta.meta.type].find_element('', this.meta.meta, this.context, Field.Base.keys(this.params.view.focus)).focus();
    else if (this.params.default_focus)
        Field[this.meta.meta.type].find_element('', this.meta.meta, this.context, Field.Base.keys(this.params.default_focus)).focus();
    else
        $(".control-default-focus", this.context).focus();
}


ControlList.prototype.attach_event_handlers=function()
{   
    var this_control=this;
    var context=this.context;


    ControlBase.prototype.attach_event_handlers.call(this);

    //some  control changed/added an item in our class, so update the list
    $(context).subscribe(this.params.class+'.changed', "list", function(data)
    { 


        //reload the whole view
        if (this_control.params.on_change=='reload')
        {
            console.log("ControlList: data on server has changed, reloading", data, this_control.params);
            viewLoad(this_control.params.view);
        }
        //re-get the data
        else if (this_control.params.on_change=='get')
        {

            console.log("ControlList: data on server has changed, regetting data", data, this_control.params);

            //make sure we at least get to where we left off.
            this_control.params.endless_scrolling_minimum_skip=this_control.params.get_params.skip;

            //mark all items as 'deleted'. only after regetting all the data we know which ones really can be deleted.
            //normale field.list does this, but since we're using endless scrolling that wont work. so we only let field.list remove
            //the field-list-delete class.
            $('.field-list-item[field-key=""]', this_control.context).addClass("field-list-delete");

            this_control.get_delayed({
                    list_no_remove: true,
                    list_update: true,
                    show_changes: true
            });
        }
        //only put the new data into the list
        else if (this_control.params.on_change=='put' || this_control.params.on_change=='putnew')
        {
            console.log("ControlList: data on server has changed, putting data", data, this_control.params);
            Field.List.put(
                this_control.list_source_element.attr("field-key"),
                this_control.meta,
                this_control.list_source_element,
                [ data ],
                {
                    list_no_remove: true,
                    list_no_add: this_control.params.on_change=='put', //we cant be sure if the data should be added to this list in most cases
                    list_update: true,
                    show_changes: true

                }
            );
        }
        else
        {
            console.log("ControlList: data on server has changed, ignoring", data, this_control.params);
        }

        return(false);
    });

    //some control (or maybe this control) deleted an item in our class, so update the list
    $(context).subscribe(this.params.class+'.deleted', "list", function(data)
    {

        if (this_control.params.on_delete=='delete')
        {
            console.log("ControlList: data on server has been deleted, removing it from this list", this_control);

            var key=data[this_control.meta.list_key];
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
        }
        //re-get the data
        else if (this_control.params.on_delete=='get')
        {

            console.log("ControlList: data on server has been deleted, regetting data", data, this_control.params);

            //make sure we at least get to where we left off.
            this_control.params.endless_scrolling_minimum_skip=this_control.params.get_params.skip;

            //mark all items as 'deleted'. only after regetting all the data we know which ones really can be deleted.
            //normale field.list does this, but since we're using endless scrolling that wont work. so we only let field.list remove
            //the field-list-delete class.
            $('.field-list-item[field-key=""]', this_control.context).addClass("field-list-delete");

            this_control.get_delayed({
                    list_no_remove: true,
                    list_update: true,
                    show_changes: true
            });
        }
        else
        {
            console.log("ControlList: data on server has been deleted, ignoring", data, this_control.params);
        }

        return(false);
    });
 


    //delete the element, after confirmation
    $(".control-on-click-del", context).off().click(function(event)
    {
        var list_id=Field.List.from_element_get_id(this_control.list_source_element.attr("field-key"), this);

        if (list_id===undefined)
            return;
        //TODO: code duplication? move this to a higher class?
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
//                        $.publish(this_control.params.class+'.deleted', result);

                        if (this_control.params.favorite_menu)
                        {
//                            $(document).trigger('menu.delete_favorite', {
                            $.publish('menu_delete_favorite', {
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
        this_control.params.get_params.sort=[];
        $(".control-order-asc, .control-order-desc",context).each(function()
        {
            if ($(this).hasClass("control-order-asc"))
                this_control.params.get_params.sort.push([$(this).attr("field-key"),1]);
            else
                this_control.params.get_params.sort.push([$(this).attr("field-key"),-1]);
        });

    }
    getSortSettings();

    $(".control-on-click-order", context).off().click(function()
    {

        //change to desc
        if ($(this).hasClass("control-order-asc"))
        {
            $(this).removeClass("control-order-asc");
            $(this).addClass("control-order-desc");
        }
        //change to unsorted
        else if ($(this).hasClass("control-order-desc"))
        {
            $(this).removeClass("control-order-desc");
        }
        //start with asc
        else
        {
            $(this).addClass("control-order-asc");
        }

        getSortSettings();
        this_control.get_delayed({});
    });


    $(".control-on-filter-highlight",context).off().on('click', function(e)
    {
        if ($(e.srcElement).hasClass("control-on-filter-highlight"))
        {
            //reset all controls so that they return null, hence disabling the filter
            //NOTE:maybe this needs a API in field.js?
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
    //When no special attribute is set, return all documents that contain the string.

    //When filter-match is set on the parent, filter on items that exactly match the value
    //When filter-gte is set, filter on items that are greater than or equal to the value
    //When filter-lte is set, filter on items that are less than or equal to the value
    //When filter-in is set, filter on items that match any of the values (used with multiselect filtering)
 //   $(".Xcontrol-on-change-filter", context).on('change keypress paste focus textInput input', ':input', function()
    $(context).off().on('field_changed', '.control-on-change-filter', function(event, key, meta, context, data)
    {

        // console.error("controlList field_changed", key, meta, context, data);
        // //element to look in for the attributes:
        // var attribute_element;
        // if ($(this).hasClass("control-on-change-filter"))
        //     attribute_element=$(this);
        // else
        //     attribute_element=$(this).closest(".control-on-change-filter");
        var attribute_element=$(this);

        var keys=Field.Base.keys(key);

        // console.log("resorlving", key, this_control.meta.meta);
        // var meta=Field[this_control.meta.meta.type].resolve_meta(this_control.meta.meta, keys);
        // console.log(key, meta);

        // var get_element=$(".field-get", attribute_element);
        // var value=Field[meta.type].get(key, meta, get_element);

//        console.log("get_element, keystr, meta, value" , get_element, key, meta, value);

        if (data!=null)
            attribute_element.addClass("control-filter-active");
        else
            attribute_element.removeClass("control-filter-active");

        //look if there are any other filters active under the control-on-filter-highlight element, to determine
        //if we still need to highlight it.
        if ((attribute_element.hasClass("control-filter-active") || attribute_element.closest(".control-on-filter-highlight").find(".control-filter-active").length!=0))
            attribute_element.closest(".control-on-filter-highlight").addClass("control-filter-highlight");
        else
            attribute_element.closest(".control-on-filter-highlight").removeClass("control-filter-highlight");


        //default filter is regex_or
        var filter_type="regex_or";

        if (attribute_element.attr("filter-match")=="")
            filter_type="match";

        if (attribute_element.attr("filter-gte")=="")
            filter_type="gte";

        if (attribute_element.attr("filter-lte")=="")
            filter_type="lte";

        if (attribute_element.attr("filter-in")=="")
            filter_type="match_in";

        //make sure it exists
        if (!this_control.params.get_params[filter_type])
            this_control.params.get_params[filter_type]={};

        
        var changed=false;        

        if (data==null)
        {
            if (key in this_control.params.get_params[filter_type])
            {
                delete(this_control.params.get_params[filter_type][key]);
                changed=true;
            }
        }
        else
        {
            if (this_control.params.get_params[filter_type][key]!=data)
            {
                this_control.params.get_params[filter_type][key]=data;
                changed=true;
            }
        }


        if (changed)
        {

            this_control.get_delayed({});
        }

        return(false);
    });
    
    //generic regex_or filter to do quick searches in multiple fields 
    $(".control-on-change-search", context).off(".control-on-change-search").on('change.control-on-change-search keypress.control-on-change-search paste.control-on-change-search textInput.control-on-change-search input.control-on-change-search', function()
    {
        this_control.context.scrollTop(0);

        var search_txt=$(this).val();

        if (this_control.last_search_txt==search_txt)
            return ;

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

        this_control.get_delayed({});

    });


    //enable endless scrolling?
    if (this_control.params.endless_scrolling)
    {

        var prev_height=0;
        $(this.scroll_context).off("scroll").on("scroll",function()
        {

            var scroll_height=$(this).prop('scrollHeight');
            var height=$(this).height();
            var top=$(this).scrollTop();

       
            //scroll_height has changed and we almost scrolled to the bottom?
            if (scroll_height!=prev_height && top>=scroll_height-(height*2))
            {
                prev_height=scroll_height;

                console.debug("endless scrolling: almost scrolled to end, getting more data");
                this_control.get_delayed({
                    list_no_remove: true,
                    list_update: true,
                    list_continue: true
     
                });

            }
        });


        // $(context).on("view.scrolledBottom",function()
        // {
        //     this_control.params.get_params.skip+=this_control.params.get_params.limit;
        //     //NOTE: maybe we should create a small overlap to allow for deleted items on the server?
        //     console.debug("endless scroll skip is ", this_control.params.get_params.skip);
        //     this_control.get_delayed({
        //         list_no_remove: true,
        //         list_update: true,
        //         list_continue: true
 
        //     });
        // });
    }

    //create a handler to edit in place
    $(context).off("click",".control-list-on-click-edit").on("click",".control-list-on-click-edit",  function(event)
    {
        var list_id=Field.List.from_element_get_id('', this);
        var element=$(this);
        var list_element=Field.List.from_element_get('', element);

        //already clicked
        if (element.hasClass("field-meta-put"))
        {
            return(true);
        }

        //change the field from a normal put to a meta-put, and create input fields:
        $(".field-meta-put", list_element).removeClass("field-meta-put").addClass("field-put"); //cleanup leftover stuff
        element.addClass("field-meta-put");
        element.removeClass("field-put");
        Field.Dict.meta_put('', this_control.meta.meta, list_element);

        //create a place for errors
        element.append("<div class='viewErrorText viewErrorClass'></div>");

        function restore_element()
        {
            $(".field-meta-put", list_element).removeClass("field-meta-put").addClass("field-put"); 
            Field.Dict.meta_put('', this_control.meta.meta, list_element, {});
            element.empty(); //important if a key isnt set in the document
            element.text(" "); //to prevent empty table cells for field-no-text elements
        }


        //get data
        rpc(this_control.params.class+".get",{ '_id': list_id }, function(result)
        {
            //put data when changes are done:
            $(element.children().first()).off("field_one").on("field_done",function()
            {
                var doc={};
                $.extend(true, doc, result.data);

                function update(dst, src)
                {
                    for (k in src)
                    {
                        if (src[k]==null || (src[k] instanceof Array) || typeof(src[k]) != 'object')
                        {
                            dst[k]=src[k];
                        }
                        else
                        {
                            if (typeof(dst[k]) !='object')
                                dst[k]={};
                            update(dst[k], src[k]);
                        }
                    }
                }
                update(doc, Field.Dict.get('', this_control.meta.meta, list_element));


                if (!_.isEqual(result.data,doc))
                {
                    busy=true;
                    rpc(this_control.params.class+".put", doc, function(result)
                    {
                        if (!viewShowError(result, element, this_control.meta.meta))
                        {
                            restore_element();
//                            $.publish(this_control.params.class+'.changed', result);
                        }
                    });
                }
                else
                    if (!busy)
                    {
                        //nothing changed so dont send a changed-event
                        restore_element();
                        Field.Dict.put('', this_control.meta.meta, list_element, result.data, {});
                    }
                
            });

            //fill data, invoke the 'default action' (e.g. inverting a checkbox or opening a selectbox)
            Field.Dict.put('', this_control.meta.meta, list_element, result.data, { field_action: true });
            $(":input", element).focus();

            // var last_put=Field.Dict.get('', this_control.meta.meta, list_element);
            // last_put['_id']=list_id;

            var busy=false; //busy rpc-ing, or waiting for user to correct error


        });
    });


}



//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//list controller for relations
//this is the 'reverse' of field.Relation. look in the example-module for more info.
/*
params:
    (look in the baseclasses for the basic documentation)

    related_key: field to match relations on
    related_value: value to match relations on    
    related_get: rpc function to call to get related data (default class.get)
    related_put: rpc function to call to get related data (default class.put)
    relate_confirm: text to show when relating an object (will be processed by format(..,result))
    unrelate_confirm: text to show when unrelating an object (will be processed by format(..,result))
    autocomplete_params: get-params for autocomplete queries. (default {})

    no confirm-text means no confirmation required. (delete/add at once)
*/
//FIXME: contro list only works for toplevel relations
function ControlListRelated(params)
{
    //undefined related value means the item its going to relate to is still new. so we cant do anything.
    if (params.related_value==undefined)
    {
        //call base to get the context
        if (!ControlBase.call(this, params))
            return(false);

        //hide stuff if neccesary
        $(".control-hide-on-new", this.context).hide();
        if (this.context.hasClass("control-hide-on-new"))
            this.context.hide();

        return(false);
    }

    if (!ControlList.call(this, params, true))
        return(false);

    $(".control-hide-on-edit", this.context).hide();
    if (this.context.hasClass("control-hide-on-edit"))
        this.context.hide();


    //make sure we only list documents which have relations that point to "us"
    this.params.get_params['match']={};
    this.params.get_params['match'][params.related_key]=params.related_value;

    if (!('related_get' in params))
        this.params.related_get=this.params.class+".get";

    if (!('related_put' in params))
        this.params.related_put=this.params.class+".put";

    if (!('relate_confirm' in params))
        this.params.relate_confirm="";

    if (!('unrelate_confirm' in params))
        this.params.unrelate_confirm="";

    if (!('autocomplete_params' in params))
        this.params.autocomplete_params={};

    //put doenst work with listrelations, so we need at least get:
//    if (this.params.on_change='put')
   //     this.params.on_change='get';

    this.get_meta({});

   return(true);
}
ControlListRelated.prototype=Object.create(ControlList.prototype);


//remove a relation to "us" in the related class
//this is a multistep process (get, confirm, put)
ControlListRelated.prototype.unrelate=function(related_id, highlight, confirm_text, ok_callback)
{
    var this_control=this;
    var context=this.context;

    //first GET the data of the document that points to us
    var get_params={}
    get_params[this_control.meta.list_key]=related_id;
    rpc(
        this_control.params.related_get,
        get_params,
        function(result)
        {

            var related_meta=this_control.meta.meta.meta[this_control.params.related_key];

            if (related_meta.list)
            {
                //unresolve the data, its easier for this routine
                if (related_meta.resolve)
                {
                    var unresolved=[];
                    $.each(result.data[this_control.params.related_key], function(key,value)
                    {
                        unresolved.push(value[related_meta.meta.list_key]);
                    });
                    result.data[this_control.params.related_key]=unresolved;
                }

                if (!result.data[this_control.params.related_key])
                    return;

                var id_index=result.data[this_control.params.related_key].indexOf(this_control.params.related_value);
                //there is no relation to remove?
                if (id_index==-1)
                {
                    return;
                }
            }
            else
            {
                //there is no relation to remove
                if (result.data[this_control.params.related_key]==null)
                    return;
            }

            if (!viewShowError(result, context, this_control.meta))
            {
                $(highlight).confirm({
                    'text': this_control.format(confirm_text, result.data),
                    'callback': function()
                    {
                        //now unrelate the item
                        if (related_meta.list)
                            result.data[this_control.params.related_key].splice(id_index,1);
                        else
                            result.data[this_control.params.related_key]=null

                        rpc(
                            this_control.params.related_put,
                            result.data,
                            function(result)
                            {
                                if (!viewShowError(result, context, this_control.meta))
                                {
//                                    $.publish(this_control.params.class+'.changed', result);
                                    ok_callback(result);         
                                }
                            },
                            this_control.debug_txt+"unrelating: putting updated document"
                        );                            
                    }

                });
            }
        },
        this_control.debug_txt+"unrelating: getting"
    );


}

//add a relation to "us" in the related class
//this is a multistep process (get, confirm, put)
ControlListRelated.prototype.relate=function(related_id, confirm_text, ok_callback)
{
    var this_control=this;
    var context=this.context;

    //first GET the data of the document that points to us
    var get_params={}
    get_params[this_control.meta.list_key]=related_id;
    rpc(
        this_control.params.related_get,
        get_params,
        function(result)
        {
            var related_meta=this_control.meta.meta.meta[this_control.params.related_key];
            if (related_meta.list)
            {
                //unresolve the data, its easier for this routine
                if (related_meta.resolve)
                {
                    var unresolved=[];
                    $.each(result.data[this_control.params.related_key], function(key,value)
                    {
                        unresolved.push(value[related_meta.meta.list_key]);
                    });
                    result.data[this_control.params.related_key]=unresolved;
                }

                //its already related?
                if (result.data[this_control.params.related_key] && result.data[this_control.params.related_key].indexOf(this_control.params.related_value)!=-1)
                {
                    return;
                }
            }
            else
            {
                //already related to this one?
                if (result.data[this_control.params.related_key]!=null)
                {
                    if (related_meta.resolve && result.data[this_control.params.related_key][related_meta.meta.list_key]==this_control.params.related_value)
                        return;

                    if (!related_meta.resolve && result.data[this_control.params.related_key]==this_control.params.related_value)
                        return;
                }

            }

            if (!viewShowError(result, context, this_control.meta))
            {
                $(context).confirm({
                    'text': this_control.format(confirm_text, result.data),
                    'callback': function()
                    {
                        //now add the item to the document and put it 
                        if (related_meta.list)
                        {
                            //make sure its a array
                            if(!result.data[this_control.params.related_key])
                                result.data[this_control.params.related_key]=[];

                            result.data[this_control.params.related_key].push(this_control.params.related_value)
                        }
                        else
                            result.data[this_control.params.related_key]=this_control.params.related_value;

                        rpc(
                            this_control.params.related_put,
                            result.data,
                            function(result)
                            {
                                if (!viewShowError(result, context, this_control.meta))
                                {
//                                    $.publish(this_control.params.class+'.changed', result);
                                    ok_callback(result);         
                                }
                            },
                            this_control.debug_txt+"relating: putting updated document"
                        );                            
                    }

                });
            }
        },
        this_control.debug_txt+"relating: getting"
    );
}


ControlListRelated.prototype.attach_event_handlers=function()
{
    //attach the default list event handlers
    ControlList.prototype.attach_event_handlers.call(this);

    var this_control=this;
    var context=this.context;
    //attach some extra event handlers to modify relations


    //the view that was opened by us has created a new item. relate to it automaticly 
    //NOTE: we overrule handler that was created by Field.List 
    //not needed anymore, since forms can have default values now
    // $(this_control.list_source_element.parent()).off("control_form_created").on("control_form_created",function(event, result)
    // {
    //     console.log("view opened by us has created an item", result);
    //     this_control.relate(result.data[this_control.meta.list_key],"",function(result){        });
    //     return(false);
    // });


    //remove the relation to us
    $(".control-relation-on-click-del", context).off().click(function(event)
    {
        var list_id=Field.List.from_element_get_id(this_control.list_source_element.attr("field-key"), this);

        if (list_id===undefined)
            return;

        var list_element=Field.List.from_element_get(this_control.list_source_element.attr("field-key"), this);
//        var highlight_element=this;

        this_control.unrelate(list_id, this, this_control.params.unrelate_confirm, function(result) {});

    });


    $(".control-relation-on-click-add", context).off("click").on("click",function()
    {
        $(".control-relation-on-change-autocomplete", context).autocomplete("search", "");
    })


    $(".control-relation-on-change-autocomplete", context).autocomplete({
        minLength: 0,
        autoFocus: true,
        //focus of selected suggestion has been changed
        focus: function( event, ui ) {
            return(false);
        },
        //item has been selected, create relation
        select: function (event, ui) {
            $(this).val("");
            this_control.relate(ui.item.value[this_control.meta.list_key], this_control.params.relate_confirm, function() {});
            return(false);
        },
        //data source
        source: function(request, response)
        {

            //contruct or-based case insensitive regex search, excluding all the already selected id's
            var params={};
            $.extend(true, params, this_control.params.autocomplete_params); 

            //get currently selected ids
            var current_items=Field.List.get('', this_control.meta, this_control.list_source_element);
            console.log("currentitems", current_items);

            //filter those ids out
            if (! ('match_nin' in params))
                params['match_nin']={};
            params['match_nin'][this_control.meta.list_key]=[];

            $.each(current_items, function(i, item)
            {
                params['match_nin'][this_control.meta.list_key].push(item[this_control.meta.list_key]);

            });


            //regex_or search for the specified search-string
            var search_keys=$(".control-relation-on-change-autocomplete", context).attr("search-keys").split(" ");

            if (! ('regex_or' in params))
                params['regex_or']={};

            $.each(search_keys, function(i, key_str)
            {
                params['regex_or'][key_str]=request.term;
            });

            var result_format=$(".control-relation-on-change-autocomplete", context).attr("result-format");

            //do the actual search
            rpc(this_control.params.get, //in a controList this is actuall a get_all..a bit hackish..maybe change it?
                params,
                function (result)
                {
                    viewShowError(result, context, this_control.meta);
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

}

