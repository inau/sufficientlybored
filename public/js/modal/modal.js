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

function signin_request(user, pass) {
//	post /keystone/api/session/signin
	$.post(
		
	);
}
