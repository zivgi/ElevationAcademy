var AppModel = Backbone.Model.extend({
  defaults: function () {
    return {
      beers: new BeersCollection()
    }
  }
});