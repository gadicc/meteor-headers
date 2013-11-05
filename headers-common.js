headers = {
	list: {},
	proxyCount: 0,
	get: function(header) {
		return header ? this.list[header] : this.list;
	},
	getClientIP: function(proxyCount) {
		var chain = this.list['x-ip-chain'].split(',');
		if (typeof(proxyCount) == 'undefined')
			proxyCount = this.proxyCount;
		return chain[chain.length - proxyCount - 1];
	},
	setProxyCount: function(proxyCount) {
		this.proxyCount = proxyCount;
	},
	getProxyCount: function() {
		return this.proxyCount;
	}
}
