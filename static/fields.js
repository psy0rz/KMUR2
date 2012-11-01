//construct a new fieldobject from metadata
//key should correspond with the dotted key to reach our metadata. its used to resolve html elements to operate on.
function FieldBase(meta, key)
{
    //store a reference to the metadata
    this.meta=meta;
    this.key=key;
}

/***
    context     :jquery context to operate in
    data        :data to put in
*/

//create input elements from metadata
FieldBase.prototype.create=function(context)
{

}

//create html code from data
FieldBase.prototype.create_html=function(context, data)
{

}

//put metadata fields in existing element
FieldBase.prototype.put_meta=function(context)
{

}

//store data in existing input elements
FieldBase.prototype.put=function(context,data)
{
}

//get data from existing input elements and return it
FieldBase.prototype.get=function(context)
{
}


Field['Dict']=function(meta, key)
{
    FieldBase.call(this, meta, key);

    //we're a dict: create all the subfields from the specified sub-metadata.
    for (meta_key in meta.meta)
    {
        var sub_key;
        if (key)
            sub_key=key+"."+meta_key;
        else
            sub_key=meta_key;

        /*** 
        yeah.. try to wrap your head around this one..
        this.fields will be a object that contains all the sub-field object-instances.

        example:
        meta={
            'type':'Dict',
            'desc':'the root dict object',
            'meta':{
                        'somefieldname':{
                            'type':'String',
                            'desc':'Some string'    
                        }
            }
        }

        now this constructor will do something like this:
        this.fields['somefieldname']=new Field[String]( { 'type':'String', 'desc':'Some string' }  , 'somefieldname')
        
        

        */
        this.fields={};
        this.fields[meta_key]=new Field[meta.meta[sub_key].type](meta.meta[sub_key], sub_key);

    }
}
Field['Dict'].prototype=Object.create(FieldBase.prototype);

