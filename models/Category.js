var keystone = require('keystone');
var Types = keystone.Field.Types;

var Category = new keystone.List('Category');

Category.add({
	name: {type: Types.Text, required: true, index: true, unique: true},
});


/**
 * Registration
 */
Category.defaultColumns = 'name';
Category.register();
