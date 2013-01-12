<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	
	var title="";
	var view=<?=viewGet()?>;
	controlForm({
		view			: view,
		getMeta			: 'invoices.getMeta',
		getMetaParams		: view.params,
		getData			: 'invoices.get',
		getDataParams		: view.params,
		putData			: 'invoices.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: '',
		closeAfterSave	: false,
		loadCallback	: function(result) {
			if (result.data)
				title="Wijzigen factuur "+result.data.number;
			else
				title="Nieuwe factuur";
				
			viewReady({
				view	:view,
				title	:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) 
		{ 
			view.params._id=result.data._id;
			$(document).trigger("menu.addFavorite",{
				menu:	"invoices",
				title:	"Wijzig factuur "+result.data.number,
				view:	view
			});

			//reload view
			viewLoad(view);
		}
	});

});

</script>


<fieldset style='display:inline'>
	<legend>Factuur info</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='number' _meta='desc'>
			<td class='autoPut value' _key='number' style='font-weight:bold'>
		</tr>
		<tr>
			<td class='autoMeta' _key='status' _meta='desc'>
			<td><span class='autoPut value' _key='status'/> Sinds: <span class='autoPut value' _key='statusDate'/>
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
			<td class='autoPut value' _key='company'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceName' _meta='desc'>
			<td class='autoPut value' _key='invoiceName'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceAddress' _meta='desc'>
			<td class='autoPut value' _key='invoiceAddress'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoicePostalcode' _meta='desc'>
			<td class='autoPut value' _key='invoicePostalcode'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceCity' _meta='desc'>
			<td class='autoPut value' _key='invoiceCity'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceCountry' _meta='desc'>
			<td class='autoPut value' _key='invoiceCountry'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoiceEmail' _meta='desc'>
			<td class='autoPut value' _key='invoiceEmail'>
		</tr>
		<tr>
			<td class='autoMeta' _key='invoicePhone' _meta='desc'>
			<td class='autoPut value' _key='invoicePhone'>
		</tr>
	</table>
</fieldset>


<fieldset style='display:block;'>
	<legend>Factuur items</legend>

		<table >
			<thead>
				<tr class='ui-widget-header'>
					<th>
					<th class='autoMeta' _key='items.amount' _meta='desc'>
					<th class='autoMeta' _key='items.desc' _meta='desc'>
					<th class='autoMeta' _key='items.price' _meta='desc'>
					<th class='autoMeta' _key='items.tax' _meta='desc'>
					<th>
					<th>
				</tr>
			</thead>
			<tbody class='autoSort'>
				<tr class='colorRows controlOnFocusAdd ui-widget-content autoMeta' _key='items'>
					<td class='autoClickSort ui-icon ui-icon-arrowthick-2-n-s'> 
					<td class='autoMeta' _key='items.amount' >
					<td class='autoMeta' _key='items.desc' >
					<td class='autoMeta' _key='items.price' >
					<td class='autoMeta' _key='items.tax'>					
					<td class='control-on-click-del ui-icon ui-icon-trash'>
					<td class='autoClickAdd ui-icon ui-icon-plus'>
				</tr>
				<tr>
					<td colspan=2>
					<td class='autoMeta' _key='calcedTotal' _meta='desc'>
					<td class='autoPut value' _key='calcedTotal'>
					<td>
					<td>
				</tr>				
			</tbody>
		</table>
</fieldset>


<span class='viewError'></span>
<button class='controlOnClickSave' style='display:block'>Opslaan</button>
<button class='controlOnClickSave' style='display:block'>Opslaan en versturen</button>

