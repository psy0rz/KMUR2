//publish-subscribe pattern for jquery
//(C)2013 Edwin Eefting , released under GPL.


(function ( $ ) {
 
    /*** Subscribes the handler to an event

        Namespace is the namespace of the handler: only one handler per event per dom-object is allowed for each namespace. existing handlers will be replaced.
    
        Dots in the event_name and namespace are replaced to prevent jquery namespace confusion.
        
        A helper class is used to allow jquery to trigger the handlers more efficient.

        If the jquery-dom-object is deleted correctly (using jquery functions), the handler will be gone as well. 

    */
    $.fn.subscribe = function(event_name, namespace, handler) {
        var jquery_namespaced_event=event_name.replace(".","/")+"."+namespace.replace(".","/");
        this.addClass("jquery-subscriber");
        this.off(jquery_namespaced_event);
        this.on(jquery_namespaced_event, handler);
        return this;
    };

    /*** Unsubscribes handler "id" from "event_name".
    */
    $.fn.unsubscribe = function(event_name, namespace) {
        var jquery_namespaced_event=event_name.replace(".","/")+"."+namespace.replace(".","/");
        this.off(jquery_namespaced_event);
        return this;
    };

    /*** Trigger all handlers that are subscribed to "event_name".
    */
    $.publish = function( event_name, data ) {
        var jquery_namespaced_event=event_name.replace(".","/");
        $(".jquery-subscriber").trigger(jquery_namespaced_event, data);

    };
 
 
}( jQuery ));
