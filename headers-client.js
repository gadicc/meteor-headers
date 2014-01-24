/*
 * Generate a unique token
 */
headers.token = new Date().getTime() + Math.random();

/*
 * Used for reactivity
 */
headers.dep = new Deps.Dependency;

/*
 * Called after receiving all the headers, used to re-associate headers
 * with this clients livedata session (see headers-server.js)
 */
headers.store = function(mhData) {
	this.list = mhData.headers;
	Meteor.call('headersToken', mhData.token);
 	for (var i=0; i < this.readies.length; i++)
 		this.readies[i]();
 	this.readiesRun = true;
 	this.dep.changed();
};

// On each disconnect, queue reassociation for next connection
Deps.autorun(function() {
	var status = Meteor.status();
	if (!status.connected && status.retryCount == 0) {
		Meteor.call('headersToken', headers.token);
	}
});

/*
 * This has two completely different uses, but retains the same name
 * as this is what people expect.
 *
 * With an arg: Store a callback to be run when headersHelper.js completes
 * Without an arg: Return a reactive boolean on whether or not we're ready
 */
headers.readies = [];
headers.readiesRun = false;
headers.ready = function(callback) {
	if (callback) {
		this.readies.push(callback);
		// Run immediately if headers.store() was already called previously
		if (this.readiesRun)
			callback();
	} else {
		this.dep.depend();
		return Object.keys(this.list).length > 0;
	}
};

// Since 0.0.13, headers are available before this package is loaded :)
headers.store(__headers__);
delete(__headers__);

/*
 * Get a header or all headers
 */
headers.get = function(header) {
 	this.dep.depend();
	return header ? this.list[header] : this.list;
}

/*
 * Get the client's IP address (see README.md)
 */
headers.getClientIP = function(proxyCount) {
	var chain = this.get('x-ip-chain').split(',');
	if (typeof(proxyCount) == 'undefined')
		proxyCount = this.proxyCount;
	return chain[chain.length - proxyCount - 1];
}
