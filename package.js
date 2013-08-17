Package.describe({
    summary: "Access HTTP headers on both server and client"
});

Package.on_use(function (api) {
	// api.use('jquery', 'client');
    api.add_files('headers-client.js', 'client');
    api.add_files('headers-server.js', 'server');
    if (api.export)
    	api.export('reqHeaders', ['client', 'server']);
});
