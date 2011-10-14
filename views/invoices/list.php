<? require_once("../view.php"); ?>

<script>

  
$(document).ready(function()
{
	var viewParams=<?=viewGetParams()?>;
	
	templateList({
		'element'		: viewParams.element,
		'getMeta'		: 'invoices.getMeta',		
		'getData'		: 'invoices.getAll',
		'delData'		: 'invoices.del',
		'viewParams' 	: viewParams,
		'editView'		: 'invoices.edit',
		'id'			: '_id',
		'loadCallback'	: function(result) {
			viewReady({
				'element':viewParams.element,
				'title': "Factuur overzicht"
			});
		},
		'errorCallback'	: function(result) { },
		'saveCallback'	: function(result) { }
	});


});

</script>


<table >
<tr class='ui-widget-header'>
	<th class='autoMeta' _key='number' _meta='desc'>
	<th class='autoMeta' _key='user' _meta='desc'>
	<th class='autoMeta' _key='desc' _meta='desc'>
	<th class='autoMeta' _key='status' _meta='desc'>
	<th>
</tr>

<tr class='colorRows autoPut autoListSource ui-widget-content' _key='_id' _value>
	<td class='autoPut autoClickEdit' _key='number'>
	<td class='autoPut' _key='user'>
		<span class='autoPut autoClickEdit' _key='username'></span>
	<td class='autoPut autoClickEdit' _key='desc'>
	<td class='autoPut autoClickEdit' _key='status'>
	<td class='autoClickDel ui-icon ui-icon-trash'>
</tr>
</table>

