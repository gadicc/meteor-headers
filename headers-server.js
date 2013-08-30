headers = {
	list: {},
	get: function(header) {
		return header ? this.list[header] : this.list;
	},
  getClientIP: function(proxyCount) {
    var chain = this.list['x-ip-chain'].split(',');
    proxyCount = proxyCount ? proxyCount + 1 : 1;
    return chain[chain.length - proxyCount];
  }
};

var app = typeof WebApp != 'undefined' ? WebApp.connectHandlers : __meteor_bootstrap__.app;
app.use(function(req, res, next) {
  headers.list = req.headers;

  // freebie :)
  var ipChain = [];
  _.each(headers.list['x-forwarded-for'].split(','), function(ip) {
    ipChain.push(ip.replace('/\s*/g', ''));
  });
  if (ipChain[ipChain.length-1] != req.connection.remoteAddress)
    ipChain.push(req.connection.remoteAddress);
  headers.list['x-ip-chain'] = ipChain.join(',');

  return next();
});

Meteor.methods({
    'getReqHeader': function(header) {
    	return headers.list[header];
    },
    'getReqHeaders': function() {
    	return headers.list;
    }
});
