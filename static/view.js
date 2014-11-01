
//TODO: rewrite this as 2 seperate classes (one for dom manipulation, one for abstract view handling)

//array containing view status
//views will be created and destroyed by comparing this data to the url hash
var gViewStatus={
    count:0,
    views:{}
};



function viewInit()
{
    $.history.init(function(hash){
        if (hash == "") 
            hash="('count':0,'views':())";

        // hash changed, update views:
        console.debug("view detected new url hash:", hash);
        
        var viewStatus=rison.decode(hash);

        viewSwitch(viewStatus);

    },
    { 'unescape': true } //dont urlencode   
    );

};


//compares viewStatus with gViewStatus and creates/deletes/changes the actual dom objects.
function viewSwitch(viewStatus)
{
    var oldViewStatus={};
    $.extend(true, oldViewStatus, gViewStatus);

    var newViewStatus={};
    $.extend(true, newViewStatus, viewStatus);

    //always keep highest counter
    if (oldViewStatus.count>newViewStatus.count)
        newViewStatus.count=oldViewStatus.count;

    //store the updated view state right away. (some objects do stuff with viewUpdateUrl when we delete or create them)
    gViewStatus=newViewStatus;

    //traverse the old views, and compare to new
    $.each(oldViewStatus.views, function(viewId, view)
    {
        //deleted?
        //(changed stuff will also be deleted and recreated below)
        if (! (viewId in newViewStatus.views))
        {
            viewDOMdel(view);
        }
    });

    //sort by viewId
    viewIds=Object.keys(newViewStatus.views);
    viewIds.sort(function(a,b){
        return(a.substr(4)-b.substr(4))
    })

    //traverse the new views, and compare to old
    $.each(viewIds, function(i, viewId)
    {
        var view=newViewStatus.views[viewId];

        // if ((viewId in oldViewStatus.views)) 
        // {
        //     console.log("old view params",  JSON.stringify(oldViewStatus.views[viewId].params) );
        //     console.log("new view params",  JSON.stringify(view.params) );
        // }
        //new or changed
        if (
            (! (viewId in oldViewStatus.views)) || //new
            oldViewStatus.views[viewId].name!=view.name || //different view name or params?
            ! _.isEqual(oldViewStatus.views[viewId].params, view.params) 
        )
        {
            //viewId doesnt exist yet?
            if ($("#"+viewId).length==0)
            {
                viewDOMadd(view);
            }

            //(re)load the view
            viewLoad(view);
        }
    });
}

//update the browser url, but also calls viewSwitch to do the actual switch right away.
function viewSetUrl(viewStatus)
{
    var hash=rison.encode(viewStatus);
    console.log("view changing url hash to: "+hash);
    //switch to the new status right right now, to prevent race conditions (the history loader lags behind)
    viewSwitch(viewStatus);
    jQuery.history.load(hash);
}

// update the browser url with specified view.
// this will trigger the history tracker which in turn will create and delete actual view elements.
function viewUpdateUrl(id, viewData)
{

    var viewStatus={};
    $.extend( true, viewStatus, gViewStatus );

    //no params is delete
    if (!viewData)
    {
        delete viewStatus.views[id];
    }
    //add/update
    else
    {
        viewStatus.views[id]=viewData;
        viewStatus.count++;     
    }
    
    //now copy the new views array to the browser url, triggering the history tracker which applies the actual changes:
    viewSetUrl(viewStatus); 
}


/* creates a new view of specified type, and calls viewLoad to load the view in it.
    params:
        clear: set to true to delete all other main-windows before adding the new one.
        
        creator: 
            jquery-object that was responsible for creating the view.
            A unique class will be added automaticly to it, and the selector-string for this class will be stored in view.creator 
            Will be scrolled to when view is closed.
            Usually this is used by controlls to pass back events when something has happend that the creator should know. (like adding a newly created item to a list in the creator form)

    view:
        name: name of    the view. e.g. 'core.Users.list' (will load static/views/core/Users/list.html)
        params: model specific parameters, used inside the view when asking data from the model (passed along without changing)
        mode:
            'main': add the view in the mainwindow and update viewPath.
            'popup': create a new popup window to load the view. 
            'existing': load view into an existing element id (see below)
        x,y: (for mode 'popup') coordinates for popup
        id: id of the element to load the view in. if not specified, in case of main and popup, its automaticly set to #viewX where X is the view number)
        creator: see above, automaticly set to .cviewX where X is the viewnumber. class is added to params.creator on creation and deleted when view is deleted.

        other view-parameters are just passed along. (view.focus is one thats frequently used by controls for example)

Loading views this way also ensures correct browser url and history updating.

Call viewClose to close the view.
*/
function viewCreate(params, view)
{
    //copy the current global viewstatus and change it to what we want
    var viewStatus={};
    $.extend( true, viewStatus, gViewStatus );

    //clear all main-windows?
    if (params.clear==true)
//  if (false)
    {
        //remove all mainviews
        $.each(gViewStatus.views,function(id,view)
        {
            if (viewStatus.views[id].mode=='main')
                delete viewStatus.views[id];
        });
    }

    //create new viewid
    viewStatus.count++;
    var id="view"+viewStatus.count;

    //add new view to viewStatus:
    viewStatus.views[id]={};
    $.extend(true, viewStatus.views[id], view);

    //add id field, if its not set
    if (!view.id)
        viewStatus.views[id].id=id;

    //add unique class to creator, so that we can find it back later. 
    if (params.creator)
    {
        viewStatus.views[id].creator=".c"+id;
        params.creator.addClass("c"+id);
    }


/* 
    //highlight a creator?
    if (params.creator)
    {
        //TODO: change this system?
        $(params.creator).addClass(id);
        viewStatus.views[id].highlight="."+id;
    }
*/    
    
    viewSetUrl(viewStatus);
}


//closes the specified view
function viewClose(view)
{
    //no data deletes view from url
    viewUpdateUrl(view.id);
}

/* Close all views
 * 
 */
function viewCloseAll()
{
    viewSetUrl({
        count:0,
        views:{}
    }); 
}

/*** Shows error and highlights field
 * Returns false if there are no errors to report
 */
 //FIXME: this belongs in ControlBase now
 //TODO: rename parent to context
function viewShowError(result, parent, meta)
{
    $(".viewErrorText", parent).text("");
    $(".viewError", parent).text("")
    $(".ui-state-error", parent).removeClass("ui-state-error");

    if (result!=null)
    {
        if ('error' in result)
        {
            
            //show in html element?
            if ($(".viewErrorText", parent).size()!=0 || $(".viewError", parent).size()!=0)
            {
                $(".viewErrorText", parent).text(result.error.message);
                $(".viewErrorClass", parent).addClass("ui-state-error");
                $(".viewError", parent).text(result.error.message).addClass("ui-state-error");

            }
            //create popup box
            else
            {
                $(parent).error({
                    text: result.error.message,
                    callback:function(){
                        $(".ui-state-error", parent).removeClass("ui-state-error")
                    }
                });
            }
            
            //highlight the field that has the error
            if ('fields' in result.error && meta && meta.type)
            {
                $(Field[meta.type].find_element('', meta, parent, result.error.fields)).addClass("ui-state-error").focus();
            }
            return(true);
        }
    }
    return(false);
}

//reset viewpath click handlers and visuals
function viewPathUpdate()
{
    //only the last title is the active one so it shouldnt be clickable
    $("#viewPath .viewTitle").addClass("viewTitleHistory");
    $("#viewPath .viewTitle:last").removeClass("viewTitleHistory");

    //only the last view should be visible
    $("#views .viewMain:last").show();
    $("#views .viewMain:last").prev().hide();

    //when clicking history items, remove the views on the right of it
    $(".viewTitle").unbind();
    $(".viewTitleHistory").click(function(){
        //copy the current global viewstatus and expand it with this new view
        var viewStatus={};
        $.extend( true, viewStatus, gViewStatus );
        //remove everything on the right of us
        $(this).nextAll().each(function()
        {
            console.log("deleting",this);
            delete viewStatus.views[$(this).attr("viewId")];
        });
        viewSetUrl(viewStatus);
    });
}

//adds a new view to the DOM tree
function viewDOMadd(view)
{
    // if (view.highlight)
    //     $(view.highlight).addClass("ui-state-highlight");

    var viewDiv;
    if (view.mode=='main')
    {
        //add title to path
        var titleDiv=$("<div>");
        titleDiv.addClass("viewTitle");
        titleDiv.attr("id",view.id+"Title");
        titleDiv.attr("viewId",view.id);
        titleDiv.text("...");
        $("#viewPath").append(titleDiv);
        
        viewDiv=$("<div>");
        viewDiv.addClass("ui-widget-content");
        viewDiv.addClass("viewMain");
        viewDiv.attr("id",view.id);
        viewDiv.addClass("view");
        $("#views").append(viewDiv);

        viewPathUpdate();
        
    }
    else if (view.mode=='popup')
    {
        var dialogDiv=$("<div>");
        dialogDiv.addClass("viewPopup");
        
        viewDiv=$("<div>");
        viewDiv.attr("id",view.id);
        viewDiv.addClass("view");
        
        $("body").append(dialogDiv);    
        dialogDiv.append(viewDiv);  

        var dialog=dialogDiv.dialog({
            height: 'auto',
            width: 'auto',
    //      autoResize: true,
    //      autoOpen: false,
            title: '...',
            position: [ 
                view.x,
                view.y 
            ],
            close: function(ev, ui) {
                $(this).remove();
                //NOTE: this "loops": the url will be updated, triggering a history event. then the open views will be compared to the wanted views. views that are popups will be deleted by calling this close function. shouldnt be a problem, since we are already gone by the time this happens.
                viewClose(view);
            }
        });
        
    }
    else
    {
        console.error("viewCreate: unknown view mode",view);
    }

}

//deletes a view from the DOM-tree in the correct way 
function viewDOMdel(view)
{
    var viewDiv=$("#"+view.id);
    if (view.mode=='popup')
    {
        var dialogDiv=$("#"+view.id).parent();
        dialogDiv.dialog('close'); //will delete itself
    }
    else if (view.mode=='main')
    {
        viewDiv.remove();
        $("#"+view.id+"Title").remove();
        viewPathUpdate();
    }
    else //mode existing 
    {
        //just clear it
        viewDiv.unbind();
        viewDiv.empty();
    }

    //scroll to it?
    if ($(view.creator).length!=0)
    {
//        $("body").scrollTop($(view.creator).offset().top-100);
        //$(view.highlight).removeClass("ui-state-highlight");
        //NO: goes wrong when adding stuff to formlists
        //$(view.highlight).effect('highlight',2000);

    }

    var foregroundView=$("#views .viewMain:last");
    // console.log("foreground:",foregroundView);
    // console.log("refocus",foregroundView.data('view_focus'));
    if (foregroundView.data('view_focus'))
        foregroundView.data('view_focus').focus();
}

/** Called by the view to indicate its ready and set some final options like title. And do things like resizing.

Title should be a jquery element.
 */
function viewReady(params)
{
    var viewDiv=$("#"+params.view.id);
    
    if (params.view.mode=='popup')
    {
        var dialogDiv=viewDiv.parent();

        if ('title' in params)
            dialogDiv.dialog('option', 'title', params.title);
        
        //get correct dimentions
        var cw=viewDiv.width()+50;
        var ch=viewDiv.height()+100;
        console.debug("dialog content dimentions" ,cw,ch);
        

        //resize iframe so the contents fit
        dialogDiv.dialog('option','width',cw);
        dialogDiv.dialog('option','height',ch);
        //parent.$(self.frameElement).height(ch);

        //reset position, this makes sure the dialog stays inside the browserwindow
        var pos=dialogDiv.dialog('option', 'position');
        dialogDiv.dialog('option', 'position', pos);
    }
    else if (params.view.mode=='main')
    {
        var viewTitleDiv=$("#"+params.view.id+"Title");
        viewTitleDiv.html(params.title);
        viewTitleDiv.append(" » ");
    }

    if ('title' in params)
        document.title=params.title;

    viewDiv.data('view_focus', $(':focus'));
    // console.log("focus stored", viewDiv.data('view_focus'));
}


//loads a view in the specified element
//( use viewCreate instead, if you want to update browser history and create popups etc)
function viewLoad(view)
{
    console.debug("viewLoad loading: "+view.name, view);

    var viewDiv=$("#"+view.id);
    //clear/unbind old stuff
    viewDiv.unbind();
    viewDiv.empty();



    //add nice debugging 
    if (gDebuggingEnabled)
    {
        document.getElementById(view.id).innerHTML="<div class='debug'>"+view.id+": "+view.name+": "+JSON.stringify(view)+"</div>";  //JSON.stringify(view,null,' ')
    }
    
    var view_url="views/"+view.name.replace(/\./g,"/")+".html";
    $.ajax({
        "dataType":     "html",
        "url":          view_url,
        "success":  
            function (result, status, XMLHttpRequest)
            {
                // console.debug("viewLoad success ",view);
                
                                
                //just set innerHTML, without having jquery executing the scripts:
                document.getElementById(view.id).innerHTML+=result;

                var context=$("#"+view.id);

                //hide any elements based on role. this in turn also disables the controls
                $("[view-role]", context).each(function()
                {
                    var element=$(this);
                    if (session.roles.indexOf(element.attr("view-role"))==-1)
                    {
                        element.addClass("view-disabled").hide();
                    }
                });

                //eval the scripts in the current context. 
                //the scripts should use our context-variable and view-variable as well:
                try
                {
                    eval($("#"+view.id+" script").text());
                }
                catch(e)
                {
                    console.error("Exception in view : "+"views/"+view_url);
                    //NOTE: is there anyway to give the developer more info about where it was thrown exactly?
                    throw e;
                }
                
            },
        "error":
            function (request, status, e)
            {
                console.error("Error while loading view via ajax request: ",request.responseText,status,e);
                document.getElementById(view.id).innerHTML+="<div>Error while loading data: "+request.responseText+"<div>"; 
            },
    });
            


}



(function( $ ){

    /*** popup a confim dialog at cursor and execute code on each pressed button
    */
    $.fn.confirm = function( options ) {  
        
        var settings = {
            'title'     : 'Confirmation',
            'text'      : 'Are you sure?'
        };
        
        if ( typeof options == 'function' ) 
        {
            settings['callback']=options;
        }
        else
        {
            $.extend( settings, options );
        }
        
        //no text, means no confirmation needed
        if (!settings.text)
        {
            settings.callback();
            return;
        }

        var div=$("<div>");
        div.text(settings.text);
        div.append('<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>');
        
        var parent=$(this);

        parent.addClass("ui-state-highlight");
        parent.append(div);
        
        div.dialog({
            
//          position: [ 
//              event.clientX,
//              event.clientY 
//          ],
            'modal':true,
            'title':settings.title,
            'buttons': {
                "Yes": function() {
                    settings['callback'].call(parent);
                    $( this ).dialog( "close" );
                },
                "No": function() {
                    $( this ).dialog( "close" );
                }
            },
            'close' : function(){
                parent.removeClass("ui-state-highlight");
                div.remove();
            }
        });
        
    };

    /*** popup a error dialog at cursor 
    */
    $.fn.error = function( options ) {  
        
        var settings = {
            'title'     : 'Error',
            'text'      : 'An unexpected error has occured'
        };
        
        if ( typeof options == 'function' ) 
        {
            settings['callback']=options;
        }
        else
        {
            $.extend( settings, options );
        }


        var div=$("<div>");
        div.text(settings.text);
        div.append('<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>');
        
        var parent=$(this);

        parent.append(div);
        
        div.dialog({
            
//          position: [ 
//              event.clientX,
//              event.clientY 
//          ],
            'modal':true,
            'title':settings.title,
            'buttons': {
                "Ok": function() {
                    $( this ).dialog( "close" );
                }
            },
            'close' : function(){
                if (settings.callback)
                {
                    settings.callback();
                }
                div.remove();
            }
        });
        
    };

    
})( jQuery );



