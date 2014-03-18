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
	if (mhData.proxyCount)
		this.proxyCount = mhData.proxyCount;
	Meteor.call('headersToken', mhData.token || this.token);
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

if (0 && __headers__) {
	// Since 0.0.13, headers are available before this package is loaded :)
	headers.store(__headers__);
	delete(__headers__);
} else {
	// Except in tests, browserPolicy disallowInlineScripts() and appcache
	/*
 	* Create another connection to retrieve our headers (see README.md for
 	* why this is necessary).  Called with our unique token, the retrieved
 	* code runs headers.store() above with the results
	*/
	(function(d, t) {
	    var g = d.createElement(t),
	        s = d.getElementsByTagName(t)[0];
	    g.src = '/headersHelper.js?token=' + headers.token;
	    s.parentNode.insertBefore(g, s);
	}(document, 'script'));
}

/*
 * Get a header or all headers
 */
headers.get = function(header) {
 	this.dep.depend();
	return header ? this.list[header.toLocaleLowerCase()] : this.list;
}

/*
 * Get the client's IP address (see README.md)
 */
headers.getClientIP = function(proxyCount) {
	var chain = this.get('x-ip-chain').split(',');
	if (typeof(proxyCount) == 'undefined')
		proxyCount = this.proxyCount;
	console.log(chain, proxyCount);
	return chain[chain.length - proxyCount - 1];
}
