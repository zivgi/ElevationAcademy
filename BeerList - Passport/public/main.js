var appModel = new AppModel();
var appView = new AppView({ model: appModel });

var loginView = new LoginView({ el: $("#login_container") });
var registerView = new RegisterView({ el: $("#register_container") });

appModel.get('beers').fetch({reset: true});