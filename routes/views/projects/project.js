var keystone = require('keystone');
var project = keystone.list('Project');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	
	var locals = res.locals;

	locals.project = null;
	
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'projects';

	locals.formData = req.body || {};
	locals.pid = req.params.projectid;

	view.on('init', function (next) {
		project.model.findOne({_id: locals.pid}).exec(function (err, pro) {
			if(err) {
				req.flash('error', { title: 'An error occurred', detail: 'Nothing found for '+locals.pid } );
				next(err);
			} else {
				keystone.populateRelated(pro,'sections', function() {
					locals.project = pro;
					console.log( JSON.stringify(pro) );
					next(err);
				});
			}
		});
	});
	
	// Render the view
	view.render('projects/project');
};
