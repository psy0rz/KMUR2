<? require_once("../view.php"); ?>

<script>
$(this).ready(function()
{
	var view=<?=viewGet()?>;
	templateForm({
		view			: view,
		getMeta			: 'users.getMeta',
		getMetaParams		: view.params,
		getData			: 'users.get',
		getDataParams		: view.params,
		putData			: 'users.put',
		putDataParams		: { "_id": view.params._id },
		defaultFocus	: [ "username" ],
		closeAfterSave	: true,
		loadCallback	: function(result) {
			if (result.data)
				title="Wijzigen gebruiker "+result.data.username;
			else
				title="Nieuwe gebruiker";
				
			viewReady({
				view: view,
				title:title
			});
			
		},
		errorCallback	: function(result) { },
		saveCallback	: function(result) {
			$(document).trigger("menu.addFavorite",{
				menu:		"users",
				title:		"Wijzig "+result.data.username,
				view:		view
			});
		}
	});

});

</script>

<fieldset style='display:inline-block;'>
	<legend>Inlog gegevens</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='active' _meta='desc'>
			<td class='autoMeta' _key='active'>
		</tr>
		<tr>
			<td class='autoMeta' _key='username' _meta='desc'>
			<td class='autoMeta' _key='username'>
		</tr>
		<tr>
			<td class='autoMeta' _key='password' _meta='desc'>
			<td class='autoMeta' _key='password'>
		</tr>
		<tr>
			<td class='autoMeta' _key='rights' _meta='desc'>
			<td class='autoMeta' _key='rights'  style='background:#eeffee;'>
		</tr>
	</table>
</fieldset>

<fieldset style='display:inline-block;'>
	<legend>Contact gegevens</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='company' _meta='desc'>
			<td class='autoMeta' _key='company'>
		</tr>
		<tr>
			<td class='autoMeta' _key='name' _meta='desc'>
			<td class='autoMeta' _key='name'>
		</tr>
		<tr>
			<td class='autoMeta' _key='address' _meta='desc'>
			<td class='autoMeta' _key='address'>
		</tr>
		<tr>
			<td class='autoMeta' _key='postalcode' _meta='desc'>
			<td class='autoMeta' _key='postalcode'>
		</tr>
		<tr>
			<td class='autoMeta' _key='city' _meta='desc'>
			<td class='autoMeta' _key='city'>
		</tr>
		<tr>
			<td class='autoMeta' _key='country' _meta='desc'>
			<td class='autoMeta' _key='country'>
		</tr>
		<tr>
			<td class='autoMeta' _key='email' _meta='desc'>
			<td class='autoMeta' _key='email'>
		</tr>
		<tr>
			<td class='autoMeta' _key='phone' _meta='desc'>
			<td class='autoMeta' _key='phone'>
		</tr>
	</table>
</fieldset>

<fieldset  style='display:inline-block;'>
	<legend>Factuur gegevens</legend>
	<table>
		<tr>
			<td class='autoMeta' _key='tax' _meta='desc'>
			<td class='autoMeta' _key='tax'>
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
		<tr>
			<td class='autoMeta' _key='bankNumber' _meta='desc'>
			<td class='autoMeta' _key='bankNumber'>
		</tr>
		<tr>
			<td class='autoMeta' _key='taxNumber' _meta='desc'>
			<td class='autoMeta' _key='taxNumber'>
		</tr>
		<tr>
			<td class='autoMeta' _key='kvkNumber' _meta='desc'>
			<td class='autoMeta' _key='kvkNumber'>
		</tr>
	</table>
</fieldset>


<div class='floatingBar viewErrorClass'>
	<button class='templateOnClickSave' >Opslaan</button>
	<span class='viewErrorText'></span>
</div>
