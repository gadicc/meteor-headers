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
headers.store = function(headers) {
	this.list = headers;
	Meteor.call('headersToken', this.token);
 	for (var i=0; i < this.readies.length; i++)
 		this.readies[i]();
 	this.readiesRun = true;
 	this.dep.changed();
};

/*
need to think about surviving a hot code reload, headers on server lost
Deps.autorun(function() {
	if (Meteor.status().connected)
		Meteor.call('headersToken', this.token);
});
*/

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
