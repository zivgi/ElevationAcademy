var RegisterView = Backbone.View.extend({
  //el: $('body'),

  template: Handlebars.compile($('#register-template').html()),
  
  events: {
    'click #registerButton': 'register'
  },

  initialize: function () {
    this.render();
  },

  render:function () {
        $(this.el).html(this.template());
        return this;
    },
	
  register: function (event) {
	event.preventDefault(); // We'll submit ourselves.
	$('.errorMsg').hide(); // Clear previous errors
	
    var user = new UserModel({
		isRegisterNew:true,	
		username: this.$('#register-username').val(), 
		password: this.$('#register-password').val(), 
		retypePassword: this.$('#register-retypePassword').val()
	});
    console.log("save")
	user.save({}, {
		success: function (user) {
			alert(user.attributes['username'] +  " is successfully registered");
		},
		error : function (user, response) {
		}
	})
  },

  addBeer: function (beer) {
    var beerView = new BeerView({ model: beer });
    this.$beerList.append(beerView.render().el);
  },

  renderBeers: function () {
    this.model.get('beers').each(function (m) {
      this.addBeer(m);
    }, this);
  }
});