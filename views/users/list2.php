<? require_once("../view.php"); ?>


<script type="text/javascript" language="javascript" src="lib/jquery.dataTables.js"></script> 

<script>
$(this).ready(function()
{
	var viewParams=<?=viewGetParams()?>;
//		'element'		: viewParams.element,
	$(".datatable").dataTable(
	 {
		"aaData": [
			/* Reduced data set */
			[ "Trident", "Internet Explorer 4.0", "Win 95+", 4, "X" ],
			[ "Trident", "Internet Explorer 5.0", "Win 95+", 5, "C" ],
			[ "Trident", "Internet Explorer 5.5", "Win 95+", 5.5, "A" ],
			[ "Trident", "Internet Explorer 6.0", "Win 98+", 6, "A" ],
			[ "Trident", "Internet Explorer 7.0", "Win XP SP2+", 7, "A" ],
			[ "Gecko", "Firefox 1.5", "Win 98+ / OSX.2+", 1.8, "A" ],
			[ "Gecko", "Firefox 2", "Win 98+ / OSX.2+", 1.8, "A" ],
			[ "Gecko", "Firefox 3", "Win 2k+ / OSX.3+", 1.9, "A" ],
			[ "Webkit", "Safari 1.2", "OSX.3", 125.5, "A" ],
			[ "Webkit", "Safari 1.3", "OSX.3", 312.8, "A" ],
			[ "Webkit", "Safari 2.0", "OSX.4+", 419.3, "A" ],
			[ "Webkit", "Safari 3.0", "OSX.4+", 522.1, "A" ]
		],
		"aoColumns": [
			{ "sTitle": "Engine" },
			{ "sTitle": "Browser" },
			{ "sTitle": "Platform" },
			{ "sTitle": "Version", "sClass": "center" },
			{
				"sTitle": "Grade",
				"sClass": "center",
				"fnRender": function(obj) {
					var sReturn = obj.aData[ obj.iDataColumn ];
					if ( sReturn == "A" ) {
						sReturn = "<b>A</b>";
					}
					return sReturn;
				}
			}
		]
	} );	

});

</script>


<table class='datatable'>

</table>
