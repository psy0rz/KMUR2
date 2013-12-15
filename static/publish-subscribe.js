//publish-subscribe pattern for jquery
//(C)2013 Edwin Eefting , released under GPL.


(function ( $ ) {
 
    /*** Subscribes the handler to an global event. 
        (this is different from jquery's system which is context based and has bubbling up)

        Namespace is the namespace of the handler: only one handler per event per dom-object is allowed for each namespace. existing handlers will be replaced.
         
        If the jquery-dom-object is deleted correctly (using jquery functions), the handler will be gone as well. 

    */
    $.fn.subscribe = function(event_name, namespace, handler) {
        namespace=namespace.replace(/[^a-zA-Z0-9]/g,"_");
        var class_event_name="subscribe_"+event_name.replace(/[^a-zA-Z0-9]/g,"_");
        this.addClass(class_event_name);
        if (!this.data(class_event_name))
        {
            this.data(class_event_name,{});
        }
        this.data(class_event_name)[namespace]=handler;
        // console.log("subscriptions",class_event_name, this.data(class_event_name));
        return this;
    };

    /*** Unsubscribes handler "id" from "event_name".
    */
    $.fn.unsubscribe = function(event_name, namespace) {
        namespace=namespace.replace(/[^a-zA-Z0-9]/g,"_");
        var class_event_name="subscribe_"+event_name.replace(/[^a-zA-Z0-9]/g,"_");
        if (this.data(class_event_name))
        {
            if (namespace in this.data(class_event_name))
            {
                delete(this.data(class_event_name)[namespace]);
                if (this.data(class_event_name).length==0)
                {
                    this.removeClass(class_event_name);
                }
            }
        }
        return this;
    };

    /*** Trigger all handlers that are subscribed to "event_name".
    */
    $.publish = function( event_name, data ) {
        var class_event_name="subscribe_"+event_name.replace(/[^a-zA-Z0-9]/g,"_");
        //traverse all the dom objects that have A subscription to this event
        $("."+class_event_name).each(function()
        {
            //traverse all the handlers for this event
            if ($(this).data(class_event_name))
            {
                var this_element=this;
                $.each($(this).data(class_event_name), function(namespace, handler)
                {
                    handler.call(this_element,data);
                });
            }
        });
    };
 
 
}( jQuery ));
