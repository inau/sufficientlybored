var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Project = new keystone.List('Project');

Project.add({
		state: {type: Types.Select, required:true, index: true, initial: true, options: 'Finished, Ongoing', default: "Ongoing"},
		from: {type: Types.Date, required: true, initial: true, index: true},
		to: {type: Types.Date, required: true,initial: true, index: true},
		title: {type: Types.Text, required: true, initial: true, index: true},
		links : {type: Types.TextArray },
		categories: { type: Types.Relationship, ref: 'Category', many: true },
		sections : {type: Types.Relationship, ref: 'Section',  many: true }
});

Project.relationship({path: 'sections', ref: 'Section', refPath: 'project'});
Project.relationship({path: 'categories', ref: 'Category', refPath: ''});

/**
 * Registration
 */
Project.defaultColumns = 'title, sections';
Project.register();
