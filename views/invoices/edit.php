<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	
	var title="";
	var view=<?=viewGet()?>;
	templateForm({
		view			: view,
		getMeta			: 'invoices.getMeta',
		getMetaParams		: view.params,
		getData			: 'invoices.get',
		getDataParams		: view.params,
		putData			: 'invoices.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: '',
		loadCallback	: function(result) {
			if (view.params._id)
			{
				title="Wijzigen factuur "+result.data.number;
				menuAddFavorite({
					menu:	"invoices",
					desc:	"Wijzig factuur "+result.data.number,
					view:	view
				});
			}
			else
				title="Nieuwe factuur";
				
			viewReady({
				view	:view,
				title	:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) { }
	});

});

</script>


<fieldset style='display:inline'>
	<legend>Factuur info</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='number' _meta='desc'>
			<td class='autoPut' _key='number' style='font-weight:bold'>
		</tr>
		<tr>
			<td class='autoMeta' _key='status' _meta='desc'>
			<td><span class='autoMeta' _key='status'/> Sinds: <span class='autoPut' _key='statusDate'/>
		</tr>
		<tr>
			<td class='autoMeta' _key='userId' _meta='desc'>
			<td class='autoMeta' _key='userId'>
		</tr>
		<tr>
			<td class='autoMeta' _key='desc' _meta='desc'>
			<td class='autoMeta' _key='desc'>
		</tr>
		
	</table>
</fieldset>


<fieldset style='display:inline'>
	<legend>Adres gegevens</legend>
	<table >
		<tr>
			<td class='autoMeta' _key='company' _meta='desc'>
			<td class='autoMeta' _key='company'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceName' _meta='desc'>
			<td class='autoMeta' _key='invoiceName'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceAddress' _meta='desc'>
			<td class='autoMeta' _key='invoiceAddress'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoicePostalcode' _meta='desc'>
			<td class='autoMeta' _key='invoicePostalcode'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceCity' _meta='desc'>
			<td class='autoMeta' _key='invoiceCity'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceCountry' _meta='desc'>
			<td class='autoMeta' _key='invoiceCountry'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceEmail' _meta='desc'>
			<td class='autoMeta' _key='invoiceEmail'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoicePhone' _meta='desc'>
			<td class='autoMeta' _key='invoicePhone'>
		</tr>
	</table>
</fieldset>


<fieldset style='display:block;'>
	<legend>Factuur items</legend>

		<table class='autoMeta' _key='items'>
			<thead>
				<tr class='ui-widget-header'>
					<th>
					<th class='autoMeta' _key='amount' _meta='desc'>
					<th class='autoMeta' _key='desc' _meta='desc'>
					<th class='autoMeta' _key='price' _meta='desc'>
					<th class='autoMeta' _key='tax' _meta='desc'>
					<th>
					<th>
				</tr>
			</thead>
			<tbody class='autoSort'>
				<tr class='colorRows autoListSource autoFocusAdd ui-widget-content'>
					<td class='autoClickSort ui-icon ui-icon-arrowthick-2-n-s'> 
					<td class='autoMeta' _key='amount' >
					<td class='autoMeta' _key='desc' >
					<td class='autoMeta' _key='price' >
					<td class='autoMeta' _key='tax'>					
					<td class='autoClickDel ui-icon ui-icon-trash'>
					<td class='autoClickAdd ui-icon ui-icon-plus'>
				</tr>
			</tbody>
		</table>
</fieldset>


<button class='autoClickSave' style='display:block'>Opslaan</button>
<span class='autoError'></span>

