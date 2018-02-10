var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Project = new keystone.List('Project');

Project.add({
		from: {type: Types.Date, required: true, initial: true, index: true},
		to: {type: Types.Date, required: true,initial: true, index: true},
		title: {type: Types.Text, required: true, initial: true, index: true},
		links : {type: Types.TextArray },
		sections : {type: Types.Relationship, ref: 'Section',  many: true }
});

Project.relationship({path: 'sections', ref: 'Section', refPath: 'project'});

/**
 * Registration
 */
Project.defaultColumns = 'title, sections';
Project.register();
