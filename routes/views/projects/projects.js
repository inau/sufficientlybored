var keystone = require('keystone');
var project = keystone.list('Project');
var category = keystone.list('Category');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;
	locals.data = {};
	locals.cc = [];
	locals.labels = req.query.labels;

	locals.meta = {};

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'projects';
	view.on('init', function (next) {
		category.model.find().sort('name').exec(function (err, cats) {
			if(err) {
				next(err);
			} else {
				locals.data.categories = cats;

				next(err);
			}
		});
	});
	
	view.on('init', function (next) {
		locals.data.categories.map(function(c,i){
			var n = {id: c._id, label: c.name, checked: false};
			//locals.meta[ c.name ] = n;
			locals.meta[ c._id ] = n;
		});
		if(req.query.cats) {
			locals.cc = req.query.cats.split(',');
			//console.log( locals.cc );

			locals.filter = {categories: {"$in": locals.cc} };
			//for(k in locals.cc) locals.meta[k].checked = true;


			locals.cc.map(function(l,i){
				locals.meta[l].checked = true;
			} );
			console.log('mm ' + JSON.stringify(locals.meta) );

		}
		else locals.filter = {};

		project.model.find(locals.filter).exec(function (err, pros) {
			if (err) {
				req.flash('error', {title: 'Entity err',detail: '' + err.messages});
				next(err);
			} else {
				if( pros.length === 0) { next(err); }
				else {
					keystone.populateRelated(pros, 'sections', function () {
						locals.data.projects = pros;
						//console.log(JSON.stringify(pros));
						next(err);
					});
				}
			}
		});
	});

	// Render the view
	view.render('projects/projects');
};
