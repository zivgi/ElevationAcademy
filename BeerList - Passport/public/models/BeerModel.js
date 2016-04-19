var BeerModel = Backbone.Model.extend({
  idAttribute: '_id',

  defaults: {
    id: null,
    name: '',
    style: '',
    image_url: '',
    abv: null,
    edit_mode: false
  }
});