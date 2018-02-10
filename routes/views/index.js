var keystone = require('keystone');
var project = keystone.list('Project');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	locals.formData = req.body || {};

	view.on('init', function (next) {
		project.model.find().limit(3).exec(function (err, pros) {
			if(err) {
				next(err);
			} else {
				keystone.populateRelated(pros,'sections', function() {
					locals.projects = pros;
					console.log( 'projects #' + JSON.stringify(pros.length) );
					next(err);
				});
			}
		});
	});
	
	view.on('post', { action: 'user.signin' }, function(next) {
		if (!req.body.email || !req.body.password) {
			req.flash('error', { title: 'An error occurred', detail: 'Please enter your username and password.'});
			return next();
		}
		//res.redirect('/keystone/api/session/signin');

		var onSuccess = function() {
			res.redirect('/');
		}
		var onFail = function() {
			req.flash('error', { title: 'An error occurred', detail: 'Your username or password were incorrect, please try again.' } );
			return next();
		}

		keystone.session.signin({ email: locals.formData.email, password: locals.formData.password }, req, res, onSuccess, onFail);
	});
	
	// Render the view
	view.render('index');
};
