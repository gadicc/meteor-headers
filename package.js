Package.describe({
    summary: "Access HTTP headers on both server and client"
});

Package.on_use(function (api) {
	// Let's still work on Meteor < 0.6.5
	try {
		api.use(['webapp', 'livedata'], ['client', 'server']);
	}
	catch (error) {
		if (error.code != 'ENOENT')
			throw(error);
	}
    api.add_files('headers-common.js', ['client', 'server']);
    api.add_files('headers-client.js', 'client');
    api.add_files('headers-server.js', 'server');
    if (api.export) {
    	api.export('headers', ['client', 'server']);
    }
});
