Package.describe({
    summary: "Access HTTP headers on both server and client"
});

Npm.depends({
  "connect": "2.12.0"
});

Package.on_use(function(api) {
	// meteor-headers 0.0.7 was the last version to support Meteor < 0.6.5
	api.use(['webapp', 'livedata', 'templating', 'deps'], ['client', 'server']);
	api.use('appcache', 'server', { weak: true });
	api.use('inject-initial', ['server', 'client']);

    api.add_files('headers-common.js', ['client', 'server']);
    api.add_files('headers-server.js', 'server');
    api.add_files('headers-client.js', 'client');

	api.export('headers', ['client', 'server']);
});
