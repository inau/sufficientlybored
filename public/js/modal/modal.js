function modal_hide(modal_id) {
	console.log('Hide');
	var $modal = $('#'+modal_id);
	$modal.addClass('modal-hide');
}

function modal_show(modal_id) {
	console.log('Show');
	var $modal = $('#'+modal_id);
	$modal.removeClass('modal-hide');
	
	$modal.find('close').on('click', function() {modal_hide(modal_id) });
	
	$(window).on('click', function () {
		if (event.target == $modal[0]) {
			$modal.addClass('modal-hide');
		}
	});
	 
}

function getCheckboxList(checkbox_common_class, oncomplete ) {
	var vals = [];
	$('input.'+checkbox_common_class+':checkbox:checked').each(function() {
		vals.push( $(this).val() );
	});
	oncomplete(vals);
}
