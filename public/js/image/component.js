if(window.location.protocol == 'file:'){
  alert('To test this demo properly please use a local server such as XAMPP or WAMP. See README.md for more details.');
}

//encapsulates all the html elements needed by the imageManipulator
var imageBlock = function(ph_id) {
	
	var block = {
		$parent: $('<div>', {class: 'component'} ),
		image: new Image(),
		$imageContainer: {},
		controls: {
			$container: $('<div>', {class: 'btn-crop col-md-3 col-xs-12'}),
			$scaleslider: $('<input>', {type: 'range', min: 0.1, max: 1.0, value: 1.0, step:0.01, class: 'slider'}),
			$rotateleft: $('<button>', {class: 'btn btn-success col-xs-4 glyphicon glyphicon-repeat', style: 'transform: scale(-1,1);', name: 'Left'}),
			$rotateright: $('<button>', {class: 'btn btn-success col-xs-4 glyphicon glyphicon-repeat', name: 'Right'}),
			$done: $('<button>', {class: 'btn btn-success col-xs-4 glyphicon glyphicon-ok', name: 'Done'}),
			$label: $('<button>', {class: 'btn btn-success disabled col-xs-12', name: 'ratio'}),
			displayResolution: function(w,h) {
				this.$label.text( Math.floor(w) + ' x ' + Math.floor(h) ); 	
			},
			init: function() {
				this.$container.append(this.$label);
				this.$container.append(this.$rotateleft);
				this.$container.append(this.$rotateright);
				this.$container.append(this.$done);
				this.$container.append( $('<br>') );
				var ct = $('<div>', {class: 'slidecontainer'});
				this.$scaleslider.val('1');
				ct.append( this.$scaleslider );
				this.$container.append( ct );
			}
		},
		init: function () {
			this.$parent.append( $('<div>',{class: 'overlay'}).append( $('<div>',{class: 'overlay-inner'}) ) );
			
			this.$parent.append( this.image );
			this.controls.init();
			this.$parent.append( this.controls.$container );
			$('#'+ph_id).append( this.$parent );

			$( this.image ).wrap('<div class="resize-container"></div>')
				.before('')
				.after('')
			this.$imageContainer = $(this.image).parent('.resize-container');
		}
	};
	block.init();
	
	return block;
}

var load_from_file = function(placeholder_id, raw_image, i) {
	var fio = new FileReader();
	var iM = imageManipulator(placeholder_id, raw_image, i, fio);

	fio.onload = function(e) {
		iM.orig_src.src = e.target.result;
		//iM.raw_size = e.target.size;
		iM.init();
	};
	fio.onloadend = function () {
		iM.raw_size = fio.result.size;
	}

	// load the file data
	fio.readAsDataURL(raw_image);
}

var load_from_dataurl = function(placeholder_id, image_url, i) {
	
}

// Relies on bootstrap and jquery
// placeholder_id is the string id of the element you embed into
// raw_image is the file from the file input
var imageManipulator = function(placeholder_id, raw_image, i, fio) {
	//var fio = new FileReader();
	var iM = {
		orig_src: new Image(),
		raw_size: null,
		htmlBlock:{},
		event_state: {},
		$result_div: $('<div>', {class: 'col-xs-12 col-md-6'}),
		canvas: document.createElement('canvas'),
		save: function(blob) {
			var after_size = blob.size;
			fio.onload = function () {};
			fio.onloadend = function() {
				//console.log( fio.result );
				iM.$result_div.append( $('<div>').html('size: '+iM.raw_size+', after: '+after_size ) );
				iM.$result_div.append( $('<input>', {name: 'image'+i, class: 'hidden mdata'}).attr('value', fio.result.replace('data:image/jpeg;base64,','') ) );
			};
			fio.readAsDataURL(blob);
		},
		init: function() {
			iM.htmlBlock = imageBlock(placeholder_id);
	
			iM.htmlBlock.image.src = iM.orig_src.src;

			iM.htmlBlock.controls.$rotateleft.on('click', function(){ return iM.updaterot(-90); });
			iM.htmlBlock.controls.$rotateright.on('click', function(){ return iM.updaterot(90); });
			iM.htmlBlock.controls.$scaleslider.on('change', function(){ return iM.scale( this.value ); });

			iM.htmlBlock.controls.$done.on('click', function(){iM.crop(); return false;});

			iM.htmlBlock.$imageContainer.on('mousedown touchstart', 'img', iM.startMoving);
			
			$( iM.htmlBlock.image).on('load', function(){iM.htmlBlock.controls.displayResolution( this.width, this.height ) ;return false;})
		},
		saveEventState: function(e){
			// Save the initial event details and container state
			iM.event_state.container_width = iM.htmlBlock.$imageContainer.width();
			iM.event_state.container_height = iM.htmlBlock.$imageContainer.height();
			iM.event_state.container_left = iM.htmlBlock.$imageContainer.offset().left;
			iM.event_state.container_top = iM.htmlBlock.$imageContainer.offset().top;
			iM.event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
			iM.event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
	
			// This is a fix for mobile safari
			// For some reason it does not allow a direct copy of the touches property
			if(typeof e.originalEvent.touches !== 'undefined'){
				iM.event_state.touches = [];
				$.each(e.originalEvent.touches, function(i, ob){
					iM.event_state.touches[i] = {};
					iM.event_state.touches[i].clientX = 0+ob.clientX;
					iM.event_state.touches[i].clientY = 0+ob.clientY;
				});
			}
			iM.event_state.evnt = e;
		},
		startMoving: function(e){
			e.preventDefault();
			e.stopPropagation();
			iM.saveEventState(e);
			$(document).on('mousemove touchmove', iM.moving);
			$(document).on('mouseup touchend', iM.endMoving);
		},
		endMoving: function(e){
			e.preventDefault();
			$(document).off('mouseup touchend', iM.endMoving);
			$(document).off('mousemove touchmove', iM.moving);
		},
		resetPos: function() {
			iM.htmlBlock.$imageContainer.offset({
				'left': iM.orig_src.width,
				'top': iM.orig_src.height
			});
		},
		moving: function(e){
			var  mouse={}, touches;
			e.preventDefault();
			e.stopPropagation();
	
			touches = e.originalEvent.touches;
	
			mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft();
			mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop();
			iM.htmlBlock.$imageContainer.offset({
				'left': mouse.x - ( iM.event_state.mouse_x - iM.event_state.container_left ),
				'top': mouse.y - ( iM.event_state.mouse_y - iM.event_state.container_top )
			});
			// Watch for pinch zoom gesture while moving
			if(iM.event_state.touches && iM.event_state.touches.length > 1 && touches.length > 1){
				var width = iM.event_state.container_width, height = iM.event_state.container_height;
				var a = iM.event_state.touches[0].clientX - iM.event_state.touches[1].clientX;
				a = a * a;
				var b = iM.event_state.touches[0].clientY - iM.event_state.touches[1].clientY;
				b = b * b;
				var dist1 = Math.sqrt( a + b );
	
				a = e.originalEvent.touches[0].clientX - touches[1].clientX;
				a = a * a;
				b = e.originalEvent.touches[0].clientY - touches[1].clientY;
				b = b * b;
				var dist2 = Math.sqrt( a + b );
	
				var ratio = dist2 /dist1;
	
				width = width * ratio;
				height = height * ratio;
				// To improve performance you might limit how often resizeImage() is called
				iM.resizeImage(width, height);
			}
		},
		resizeImage: function(width, height){
			//htmlBlock.controls.displayResolution(width , height);
			iM.canvas.width = width;
			iM.canvas.height = height;
			var ctx = iM.canvas.getContext('2d');
	
			ctx.drawImage(iM.orig_src, 0, 0, iM.canvas.width, iM.canvas.height);
			if(!iM.raw_size) {
				iM.canvas.toBlob( function(b){
					iM.raw_size = b.size;
				}, 'image/jpeg', 1);
			}
			$(iM.htmlBlock.image).attr('src', iM.canvas.toDataURL("image/png"));
		},
		scale: function(factor) {
			iM.htmlBlock.$imageContainer.offset({
				'left': iM.htmlBlock.$imageContainer.offset().left,
				'top': iM.htmlBlock.$imageContainer.offset().top
			});
			iM.resizeImage(iM.orig_src.width * factor, iM.orig_src.height * factor);
			
			return false;
		},
		updaterot: function(deg) {
			var ctx = this.canvas.getContext('2d');
			var w = this.canvas.width, h = this.canvas.height;
			
			ctx.clearRect(0,0,w,h);
			
			ctx.translate(w/2, h/2);
			ctx.rotate( Math.PI / 180 * deg );
			ctx.translate(-w/2, -h/2);
			ctx.drawImage(iM.orig_src, 0,0, w, h);
			$(iM.htmlBlock.image).attr('src', iM.canvas.toDataURL("image/png"));

			return false;
		},
		crop: function(){
		//Find the part of the image that is inside the crop box
		var crop_canvas,
			left = $('.overlay').offset().left - iM.htmlBlock.$imageContainer.offset().left,
			top =  $('.overlay').offset().top - iM.htmlBlock.$imageContainer.offset().top,
			width = $('.overlay').width(),
			height = $('.overlay').height();

		crop_canvas = document.createElement('canvas');
		crop_canvas.width = width;
		crop_canvas.height = height;
			
		var img = new Image();
		img.className = 'col-xs-12';
		this.$result_div.append( $(img) );
		
		crop_canvas.getContext('2d').drawImage(iM.htmlBlock.image, left, top, width, height, 0, 0, width, height);

		$('#imgpreview').append( this.$result_div );

			$(img).attr('src', crop_canvas.toDataURL("image/png"));

			var qual = 1;
			if( this.canvas.width/2 > this.orig_src.width ) qual = 0.85;
			
			console.log('quality: ' + qual);
		crop_canvas.toBlob( function(b){
			iM.save(b);
		}, 'image/jpeg', qual);
		
		iM.htmlBlock.$parent.remove();
		}
	};


	/**
	
	fio.onload = function(e) {
		iM.orig_src.src = e.target.result;
		//iM.raw_size = e.target.size;
		iM.init();
	};
	fio.onloadend = function () {
		iM.raw_size = fio.result.size;
	}

	// load the file data
	fio.readAsDataURL(raw_image);
	**/
	return iM;
}

var resizeableImage = function(image_tar, raw_image) {
	
  // Some variable and settings
  var $container,
      orig_src = new Image(),
      image_target = $(image_tar).get(0),
      event_state = {},
      constrain = false,
      min_width = 20, // Change as required
      min_height = 20,
      max_width = 4000, // Change as required
      max_height = 4000,
	  angle = 0,
	  scalefactor = .5,
	  flag = true,
      resize_canvas = document.createElement('canvas');

  init = function(){

    // When resizing, we will always use this copy of the original as the base
    orig_src.src=image_target.src;
    //max_width = orig_src.width;
    //max_height = orig_src.height;

    // Wrap the image with the container and add resize handles
    $(image_target).wrap('<div class="resize-container"></div>')
    .before('<span class="resize-handle resize-handle-nw"></span>')
    .before('<span class="resize-handle resize-handle-ne"></span>')
    .after('<span class="resize-handle resize-handle-se"></span>')
    .after('<span class="resize-handle resize-handle-sw"></span>');

    // Assign the container to a variable
    $container =  $(image_target).parent('.resize-container');

    // Add events
    //$container.on('mousedown touchstart', '.resize-handle', startResize);
    $container.on('mousedown touchstart', 'img', startMoving);
    $('.mbtncrop').on('click', crop);
    $('.mbtnrotl').on('click', function() {rot(-1); return false;});
    $('.mbtnrotr').on('click', function() {rot(1); return false;});
    $('.mbtnscalehalf').on('click', function() {scaledown(); return false;});
    $('.mbtnscalefourth').on('click', function() {scaleup(); return false;});
  };

  scaleup = function() {
  	scalefactor += 0.1;
  	scale(scalefactor);	
  }
	scaledown = function() {
		scalefactor -= 0.1;
		scale(scalefactor);
	}
  
  scale = function(factor) {
	 resizeImage(orig_src.width * factor, orig_src.height * factor, angle);
  }
  
  rot = function(dir) {
  	angle = angle + (90*dir);
  	flag = !flag;
  	
  	if( angle >= 360) {
		angle = 0;
	}
	else if(angle < 0) {
  		angle = 270;
	}
	resizeImage(resize_canvas.width, resize_canvas.height, angle);

  }
  
  startResize = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', resizing);
    $(document).on('mouseup touchend', endResize);
  };

  endResize = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endResize);
    $(document).off('mousemove touchmove', resizing);
  };

  saveEventState = function(e){
    // Save the initial event details and container state
    event_state.container_width = $container.width();
    event_state.container_height = $container.height();
    event_state.container_left = $container.offset().left; 
    event_state.container_top = $container.offset().top;
    event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
	
	// This is a fix for mobile safari
	// For some reason it does not allow a direct copy of the touches property
	if(typeof e.originalEvent.touches !== 'undefined'){
		event_state.touches = [];
		$.each(e.originalEvent.touches, function(i, ob){
		  event_state.touches[i] = {};
		  event_state.touches[i].clientX = 0+ob.clientX;
		  event_state.touches[i].clientY = 0+ob.clientY;
		});
	}
    event_state.evnt = e;
  };

  resizing = function(e){
    var mouse={},width,height,left,top,offset=$container.offset();
    mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
    
    // Position image differently depending on the corner dragged and constraints
    if( $(event_state.evnt.target).hasClass('resize-handle-se') ){
      width = mouse.x - event_state.container_left;
      height = mouse.y  - event_state.container_top;
      left = event_state.container_left;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-sw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = mouse.y  - event_state.container_top;
      left = mouse.x;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-nw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = mouse.x;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    } else if($(event_state.evnt.target).hasClass('resize-handle-ne') ){
      width = mouse.x - event_state.container_left;
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = event_state.container_left;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    }
	
    // Optionally maintain aspect ratio
    if(constrain || e.shiftKey){
      height = width / orig_src.width * orig_src.height;
    }

    if(width > min_width && height > min_height && width < max_width && height < max_height){
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height, angle);  
      // Without this Firefox will not re-calculate the the image dimensions until drag end
      $container.offset({'left': left, 'top': top});
    }
  }

  resizeImage = function(width, height, ang){
    //resize_canvas.width = width;
    //resize_canvas.height = height;
    var ctx = resize_canvas.getContext('2d');
	  if(ang == 90 || ang == 270) {
		  resize_canvas.width = height;
		  resize_canvas.height = width;
	  } else {
		  resize_canvas.width = width;
		  resize_canvas.height = height;
	  }

	  //ctx.clearRect(0,0,resize_canvas.width,resize_canvas.height);
	  switch (ang) {
		  case 90:
			  ctx.translate(-height/2,-width/2);
		  case 180:
			  ctx.translate(width,height);
		  case 270:
			  ctx.translate(height,width);
		  default:
			  ctx.translate(0,0);

	  }
	  
	  ctx.rotate(ang * (Math.PI/180) );
	  ctx.drawImage(orig_src, 0, 0, resize_canvas.width, resize_canvas.height);   
    $(image_target).attr('src', resize_canvas.toDataURL("image/png"));  
  };

  startMoving = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', moving);
    $(document).on('mouseup touchend', endMoving);
  };

  endMoving = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endMoving);
    $(document).off('mousemove touchmove', moving);
  };

  moving = function(e){
    var  mouse={}, touches;
    e.preventDefault();
    e.stopPropagation();
    
    touches = e.originalEvent.touches;
    
    mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop();
    $container.offset({
      'left': mouse.x - ( event_state.mouse_x - event_state.container_left ),
      'top': mouse.y - ( event_state.mouse_y - event_state.container_top ) 
    });
    // Watch for pinch zoom gesture while moving
    if(event_state.touches && event_state.touches.length > 1 && touches.length > 1){
      var width = event_state.container_width, height = event_state.container_height;
      var a = event_state.touches[0].clientX - event_state.touches[1].clientX;
      a = a * a; 
      var b = event_state.touches[0].clientY - event_state.touches[1].clientY;
      b = b * b; 
      var dist1 = Math.sqrt( a + b );
      
      a = e.originalEvent.touches[0].clientX - touches[1].clientX;
      a = a * a; 
      b = e.originalEvent.touches[0].clientY - touches[1].clientY;
      b = b * b; 
      var dist2 = Math.sqrt( a + b );

      var ratio = dist2 /dist1;

      width = width * ratio;
      height = height * ratio;
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height, angle);
    }
  };

  crop = function(){
    //Find the part of the image that is inside the crop box
    var crop_canvas,
        left = $('.overlay').offset().left - $container.offset().left,
        top =  $('.overlay').offset().top - $container.offset().top,
        width = $('.overlay').width(),
        height = $('.overlay').height();
		
    crop_canvas = document.createElement('canvas');
    crop_canvas.width = width;
    crop_canvas.height = height;
    
    crop_canvas.getContext('2d').drawImage(image_target, left, top, width, height, 0, 0, width, height);
    window.open(crop_canvas.toDataURL("image/png"));
  }
	var fileReader = new FileReader();
	fileReader.onload = function(e) {
		// setting the image source will trigger the image.onload event above
		image_tar.src = e.target.result;
		init();
	};

	// load the file data
	fileReader.readAsDataURL(raw_image);
  
};

