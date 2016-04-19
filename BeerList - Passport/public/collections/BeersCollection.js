var BeersCollection = Backbone.Collection.extend({
  url: '/beers',
  model: BeerModel
});