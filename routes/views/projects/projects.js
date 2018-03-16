var keystone = require('keystone');
var project = keystone.list('Project');
var category = keystone.list('Category');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;
	locals.cat = {};
	locals.data = {};
	locals.cc = [];
	locals.labels = req.query.labels;

	locals.meta = {};

	locals.pageopts = {
		min: 1,
		curr: 1,
		max: 1,
		pageSize: 5,
		total: 1,
		nextpage: function() { if(locals.pageopts.curr < locals.pageopts.max) { return +locals.pageopts.curr +1 } else return locals.pageopts.max },
		prevpage: function() { if(locals.pageopts.curr == locals.pageopts.min) { return locals.pageopts.min } else return locals.pageopts.curr - 1},
	}

	//item loader
	locals.items =
		{
			countCallback: function(err, count){
				if(err || count === 0) {
					locals.pageopts.total = 1;
					locals.pageopts.max = 1;
				}
				else {
					locals.pageopts.total = count;
					locals.pageopts.max = Math.ceil( locals.pageopts.total / locals.pageopts.pageSize ) || 10;
				}
			},
			_: keystone.list('Project'),
			page: function(nxt, cat) {
				var all;
				if(cat != null) {
					locals.items._.model.count(cat, locals.items.countCallback);
					all = locals.items._.model.find(cat).sort("-from");
				}
				else {
					locals.items._.model.count({}, locals.items.countCallback);
					all = locals.items._.model.find().sort("-from");
				}

				var some = all.skip((locals.pageopts.curr-1)*locals.pageopts.pageSize).limit(locals.pageopts.pageSize);

				some.exec(function (err, res) {
					if(err != null) {
						req.flash('error', {title: 'Entity err',detail: '' + err.messages});
						nxt(err);
					}
					else {
						keystone.populateRelated(res,'sections', function() {
							locals.items.store_result(res);
							nxt(err);
						});
					}
				});
			},
			all: function(nxt){
				var q = locals.items._.find().sort("-from");
				q.exec(function (err, res) {
					if(err != null) {
						req.flash('error', {title: 'Entity err',detail: '' + err.messages});
						nxt(err);
					}
					else {
						keystone.populateRelated(res,'sections', function() {
							locals.items.store_result(res);
							nxt(err);
						});
					}
				});
			},
			store_result: function(res) {
				locals.data.projects = res;
			}
		};
	
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
			locals.cat.filter = req.query.cats;
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

		locals.pageopts.curr = req.query.page || 1;
		locals.pageopts.pageSize = req.query.pageSize || 5	;
		locals.items.page(next, locals.filter || null);
/**		
		project.model.find(locals.filter).sort("-from").exec(function (err, pros) {
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
 **/
	});

	// Render the view
	view.render('projects/projects');
};
