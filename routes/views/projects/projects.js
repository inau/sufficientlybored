var keystone = require('keystone');
var project = keystone.list('Project');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;
	locals.data = {}

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'projects';

	view.on('init', function (next) {
			project.model.find().exec(function (err, pros) {
				if(err) {
					next(err);
				} else {
					keystone.populateRelated(pros,'sections', function() {
						locals.data.projects = pros;
						console.log( JSON.stringify(pros) );
						next(err);
					});
				}
			});
	});
	
	locals.formData = req.body || {};
	
	// Render the view
	view.render('projects/projects');
};
