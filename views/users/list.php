<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var viewParams=<?=viewGetParams()?>;
	
	templateList({
		'parent'		: viewParams.element,
		'getMeta'		: 'users.getMeta',		
		'getData'		: 'users.getAll',
		'delData'		: 'users.del',
		'viewParams' 	: viewParams,
		'editView'		: 'users.edit',
		'id'			: '_id',
		'loadCallback'	: function(result) {
			viewReady({
				'element':viewParams.element,
				'title': "Gebruikers overzicht"
			});
		},
		'errorCallback'	: function(result) { },
		'saveCallback'	: function(result) { }
	});


});

</script>


<table >
<tr class='ui-widget-header'>
	<th><span class='autoCreate' _key='active' _meta='desc'></span>
	<th><span class='autoCreate' _key='username' _meta='desc'></span>
	<th><span class='autoCreate' _key='name' _meta='desc'></span>
	<th><span class='autoCreate' _key='gender' _meta='desc'></span>
	<th><span class='autoCreate' _key='rights' _meta='desc'></span>
	<th>
</tr>

<tr class='autoList autoFill ui-widget-content' _key='_id' _value>
	<td class='autoFill clickPopup' _key='active' >
	<td class='autoFill clickPopup' _key='username' >
	<td class='autoFill clickPopup' _key='name'>
	<td class='autoFill clickPopup' _key='gender'>
	<td class='autoFill clickPopup' _key='rights'>
	<td class='clickDelete'>DEL
</tr>
</table>

