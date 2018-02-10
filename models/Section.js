var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var Section = new keystone.List('Section');

Section.add({
		project: {type: Types.Relationship, ref: 'Project', initial: true, required: true, index: true},
		description: {type: Types.Text, required: true, initial: true},
		image : {type: Types.Text }
});

/**
 * Registration
 */
Section.defaultColumns = 'description';
Section.register();
