var LoginView = Backbone.View.extend({
  el: $('body'),

  template: Handlebars.compile($('#login-template').html()),
  
  events: {
    'click #loginButton': 'login'
  },

  initialize: function(){
      this.render();
    },
    render: function(){
    },
	
  initialize: function () {
	this.render();
  },

  render:function () {
        $(this.el).html(this.template());
        return this;
    },
	
  login: function (event) {
	event.preventDefault(); // We'll submit ourselves.
	
	var user = new UserModel({ 
		username: this.$('#login-username').val(), 
		password: this.$('#login-password').val(), 
		retypePassword: this.$('#login-password').val()
	});
	user.save({}, {
		success: function (user) {
			alert(user.attributes['username'] +  " is successfully logged in")
		},
		error : function (user, response) {
			alert(user.attributes['username'] +  " is not logged!!!")
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