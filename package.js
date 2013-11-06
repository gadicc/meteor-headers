Package.describe({
    summary: "Access HTTP headers on both server and client"
});

Package.on_use(function(api) {
	// meteor-headers 0.0.7 was the last version to support Meteor < 0.6.5
	api.use(['webapp', 'livedata', 'templating'], ['client', 'server']);
	api.use('standard-app-packages', 'client');
    api.add_files('headers-common.js', ['client', 'server']);
    api.add_files('headers-server.js', 'server');
    api.add_files('headers-client.js', 'client');
	api.export('headers', ['client', 'server']);
});
