var UserModel = Backbone.Model.extend({
  idAttribute: '_id',

  defaults: {
    username: '',
    password: '',
	retypePassword: '',
	isRegisterNew: false
  },
  
  url: function(){
	console.log(this.get('isRegisterNew'))
	if (this.get('isRegisterNew')){
	console.log("/register")
		return '/register';
		}
	else
		return '/login';
        },
		
  validate: function (attrs) {
  console.log(attrs.username)
        if (!attrs.username) {
            return 'Please fill username field.';
        }
        if (!attrs.password) {
            return 'Please fill password field.';
        }
		
		if (!attrs.retypePassword) {
            return 'Please fill retype password field.';
        }
		
		if (attrs.password !== attrs.retypePassword) {
            return 'Please make sure password and retype password are equal.';
        }
    }
});