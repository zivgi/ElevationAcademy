var BeerView = Backbone.View.extend({
  className: 'beer',

  template: Handlebars.compile($('#beer-template').html()),

  events: {
    'click .remove': 'removeBeer',
    'click .edit': 'toggleEditMode',
    'keypress .edit-mode': 'updateOnEnter',
    'blur .edit-mode': 'close'
  },

  initialize: function () {
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'change:edit_mode', this.renderEdit);
    this.listenTo(this.model, 'change:name', this.render);
  },

  toggleEditMode: function () {
    this.model.set('edit_mode', !this.model.get('edit_mode'));
  },

  removeBeer: function () {
    this.model.destroy({wait : true, 
	error : function (user, response){
		//alert(response.status);
		alert("You're not authorized to remove this beer");
	},
	success: function(model, response) {
      console.log(model);
      console.log(response);
    }});
  },

  renderEdit: function () {
    this.$el.toggleClass('editing', this.model.get('edit_mode'));
  },

  // If you hit `enter`, we're through editing the item.
  updateOnEnter: function (e) {
    if (e.which === 13) {
      this.close();
    }
  },

  // Close the "editing" mode, saving changes to the beer.
  close: function () {
    var value = this.$nameInput.val();

    if (!this.model.get('edit_mode')) {
      return;
    }

	var oldName = this.model.get('name');
	var self = this;
	
    this.model.set('name', value);
    this.model.set('edit_mode', false);
    this.model.save({}, {error : function (user, response) {
			self.model.set('name', oldName);
			alert("You're not authorized to change the beer's name");	// response.status is expected to be 401
		}});
  },

  render: function () {
    this.$el.html(this.template(this.model.toJSON()));

    this.$nameInput = this.$('.edit-mode');

    return this;
  }
})