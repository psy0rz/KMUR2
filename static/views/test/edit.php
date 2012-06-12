<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	controlForm({
		view			: view,
		getMeta			: 'test.getMeta',
		getMetaParams		: view.params,
		getData			: 'test.get',
		getDataParams		: view.params,
		putData			: 'test.put',
		putDataParams		: { "_id": view.params._id },
		delData			: 'test.del',	
		defaultFocus	: [ "stringTest" ],
		closeAfterSave	: true,
		loadCallback	: function(result) {
			if (result.data)
				title="<?=_('Wijzigen test %1')?>";
			else
				title="<?=_('Nieuwe test')?>";
	//, result.data.stringTest);
			
			viewReady({
				view: view,
				title:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) {
			view.params._id=result.data._id;
			$(document).trigger("menu.addFavorite",{
				menu:		"test",	
				title: 		"Wijzig "+result.data.stringTest,
				view:		view
			});
		}
	});

});

</script>



<fieldset style='display:inline-block;'>
	<legend>Basic data structures</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='stringTest' _meta='desc'>
			<td class='autoMeta' _key='stringTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='multiselectTest' _meta='desc'>
			<td class='autoMeta' _key='multiselectTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='passwordTest' _meta='desc'>
			<td class='autoMeta' _key='passwordTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='booleanTest' _meta='desc'>
			<td class='autoMeta' _key='booleanTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='floatTest' _meta='desc'>
			<td class='autoMeta' _key='floatTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='integerTest' _meta='desc'>
			<td class='autoMeta' _key='integerTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='selectTest' _meta='desc'>
			<td class='autoMeta' _key='selectTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='dateTest' _meta='desc'>
			<td class='autoMeta' _key='dateTest' _timeFormat=''>
		</tr>
	</table>
</fieldset>

<fieldset style='display:inline-block;' class='autoMeta' _key='hash'>
	<legend>Basic structures in a hash</legend>
	<table class='autoMeta' _key='hashTest'>
		<tr>
			<td class='autoMeta' _key='hashTest.stringTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.stringTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.multiselectTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.multiselectTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.passwordTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.passwordTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.booleanTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.booleanTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.floatTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.floatTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.integerTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.integerTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.selectTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.selectTest'>
		</tr>
		<tr>
			<td class='autoMeta' _key='hashTest.dateTest' _meta='desc'>
			<td class='autoMeta' _key='hashTest.dateTest' _allowTime>
		</tr>
	</table>
</fieldset>

<fieldset  style='display:inline-block;' >
	<legend>Basic structures in a list</legend>
	<table >
		<thead >
			<tr class='autoMeta' _key='arrayTest'>
				<td>
				<td class='autoMeta' _key='arrayTest.stringTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.multiselectTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.passwordTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.booleanTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.floatTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.integerTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.selectTest' _meta='desc'>
				<td class='autoMeta' _key='arrayTest.dateTest' _meta='desc'>
				<td>
				<td>
			</tr>
		</thead>		
		<tbody class='controlSortable'>
			<tr class='colorRows autoMeta autoListSource ui-widget-content' _key='arrayTest'  _index='_id'>
				<td class='controlOnDragSort ui-icon ui-icon-arrowthick-2-n-s'> 
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.stringTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.multiselectTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.passwordTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.booleanTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.floatTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.integerTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.selectTest'>
				<td class='autoMeta controlOnFocusAdd' _key='arrayTest.dateTest'>
				<td class='controlOnClickDel ui-icon ui-icon-trash'>
				<td class='controlOnClickAdd ui-icon ui-icon-plus'>
			</tr>
		</tbody>
	</table>
</fieldset>


<div class='floatingBar viewErrorClass'>
	<button class='controlOnClickSave' ><?=_("Save")?></button>
	<button class='controlOnClickDel' ><?=_("Delete")?></button>
	<button class='controlOnClickDel' ><?=_("Cancel")?></button>
	<span class='viewErrorText'></span>
</div>