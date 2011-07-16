 
//loads a view in the specified element
function viewLoad(element, view, params, readyCallback)
{
	console.debug("view loading "+view, params);
	$.ajax({
		"dataType":		"html",
		"url":			"views/"+view.replace(".","/")+".php?"+encodeURI(JSON.stringify(params)),
		"success":	
			function (result, status, XMLHttpRequest)
			{
				console.debug("view result "+view, result);
				$(element).html(result);
				if (typeof readyCallback!='undefined')
					readyCallback();
//				$(element).execute();
			},
		"error":
			function (request, status, e)
			{
				console.error("Error while loading view via ajax request: ",request.responseText,status,e);
				$(element).text("Error while loading data: "+request.responseText);
			},

	});
			
}

//create a popup (iframe) and loads the view in it.
//calls readyCallback when its closed.
function viewPopup(event, view, params, readyCallback)
{
	var frame=$("<iframe>")

	$("body").append(frame);
	
	
	var dialog=frame.dialog({
		height: 'auto',
		width: 'auto',
		title: 'loading...',
		position: [ 
			event.clientX,
			event.clientY 
		],
		close: function(ev, ui) {
			$(this).remove(); 
		}
	});
	
	frame.attr("src","viewPopup.php");

	frame.load(function(){
		
		frame[0].contentWindow.viewLoad(
				"#viewMain",
				view, 
				params,
				function()
				{
					
				}
		);

	});
}

/** Called by view to indicate its ready and set some final options like title.
 */
function viewReady(options)
{
	if (options)
	{
		if ('title' in options)
			$(self.frameElement).parent().find(".ui-dialog-title").text(options['title']);
	}
	
	//get correct dimentions
	var cw=$("#viewMain").width()+100;
	var ch=$("#viewMain").height()+100;
	console.debug("dialog content dimentions" ,cw,ch);
	
	var bw=$(parent.window).width();
	var bh=$(parent.window).height();
	console.debug("browser window size" ,bw,bh);

	if (cw>bw)
		cw=bw;
	if (ch>bh)
		ch=bh;
	
	//calculate border overhead
	console.debug(parent.$(self.frameElement).parent().width(), parent.$(self.frameElement).width());
	console.debug(parent.$(self.frameElement).parent());
	
	var ow=parent.$(self.frameElement).dialog('option','width')-parent.$(self.frameElement).width();
	console.debug("border overhead width and height", ow);
	
	//resize iframe so the contents fit
	parent.$(self.frameElement).dialog('option','width',cw);
	parent.$(self.frameElement).dialog('option','height',ch);
	//parent.$(self.frameElement).height(ch);
	
	//reset position, this makes sure the dialog stays inside the browserwindow
	var pos=parent.$(self.frameElement).dialog('option', 'position');
	parent.$(self.frameElement).dialog('option', 'position', pos);
	
	
}

//closes the view
function viewClose()
{
	parent.$(self.frameElement).dialog('close');
}

