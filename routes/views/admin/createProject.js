// @file signup.js
// @path /routes/views/signup.js
// @description Handles the post request when the user tries to sign up.
// @url https://github.com/keystonejs/generator-keystone/issues/10
//
var keystone = require('keystone');
var db_project = keystone.list('Project');
var db_section = keystone.list('Section');
var db_category = keystone.list('Category');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'crpr';
	locals.filters = {
	};
	locals.data = {
	};
	locals.meta = {};
	locals.data.pid = req.query.pid;

	view.on('init', function (next) {
		db_category.model.find().sort('name').exec(function (err, cats) {
			if(err) {
				next(err);
			} else {
				locals.data.categories = cats;

				locals.data.categories.map(function(c,i){
					//locals.meta[ c.name ] = n;
					locals.meta[ c._id ] = {id: c._id, label: c.name, checked: false};
				});
				locals.getMeta =  JSON.stringify( locals.meta );

				next(err);
			}
		});
	});
	
	view.on('init', function (next) {
		if(locals.data.pid) {
			db_project.model.findOne({_id: locals.data.pid}).exec(function (err, pro) {
				if(!pro) {
					redirect('/admin/createProject');
					next(err);
				} else {
					keystone.populateRelated(pro,'sections', function() {
						locals.data.project = pro;
						console.log( JSON.stringify(pro) );
						next(err);
					});
				}
			});
		}
		else next();
	});


	//console.log('request');

	locals.formData = req.body || {};
	
	view.on('post', { action: 'section.create' }, function(next) {
		console.log( 'section.create' );
		//console.log( JSON.stringify(locals.formData) );
		
		if(locals.formData.description === '') {
			req.flash('error', { title: 'An error occurred', detail: 'Section does as a minimum require a description' } );
			return next();
		}

		var binimage = locals.formData.image0 || '';
		
		var newSection = new db_section.model(
			{
			project: locals.data.pid,
			description: locals.formData.description,
			image: binimage,
		});
		
		newSection.save(function(err, result) {
			if (err) {
				locals.data.validationErrors = err.errors;
				req.flash('error', { title: 'An error occurred', detail: 'save section: '+JSON.stringify(err.errors) } );
				next(err);
			} else {
				locals.data.project.sections.push(result);
				
				locals.data.project.save(function (errr, resu) {
					if (errr) {
						req.flash('error', {
							title: 'An error ocurred',
							detail: 'Update Project section list ' + JSON.stringify(errr.errors)
						});
						next(errr);
					}
					else {
						req.flash('success', {
							title: 'Success',
							detail: 'Project ' + resu._id + ' added section ' + result._id
						});
						next();
//						res.redirect('/admin/createProject?pid=' + result._id);
					}
				});
			}
		});
	});
	
	view.on('post', { action: 'project.create' }, function(next) {
		console.log( 'project.create' );
		console.log( JSON.stringify(locals.formData) );
		
		if(locals.formData.title === '' || locals.formData.from === '' || locals.formData.to === ''){
			req.flash('error', { title: 'An error occurred', detail: 'Please fill in ´title´, ´from´ and ´to´ dates' } );
			return next();
		}

		if(locals.formData.from > locals.formData.to){
			req.flash('error', { title: 'An error occurred', detail: 'Project ´from´ date has to be before the ´to´ date' } );
			return next();
		}
		
		var newProject = new db_project.model({
			title: locals.formData.title,
			from: locals.formData.from,
			to: locals.formData.from,
		});

		newProject.save(function(err, result) {
			if (err) {
				locals.data.validationErrors = err.errors;
				req.flash('error', { title: 'An error occurred', detail: ''+err.errors } );
				next();
			} else {
				req.flash('success', { title: 'Success', detail:'item '+ result._id +' created. '});
				res.redirect('/admin/createProject?pid='+result._id);
				//next();
			}
		});
	});

	// Render the view
	view.render('admin/createProject');
};
