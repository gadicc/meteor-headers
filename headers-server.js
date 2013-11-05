var app = typeof WebApp != 'undefined'
  ? WebApp.connectHandlers : __meteor_bootstrap__.app;
app.use(function(req, res, next) {
  headers.list = req.headers;

  // freebie :)
  var ipChain = [];
  if (headers.list['x-forwarded-for'])
    _.each(headers.list['x-forwarded-for'].split(','), function(ip) {
      ipChain.push(ip.replace('/\s*/g', ''));
    });
  if (ipChain.length == 0
      || ipChain[ipChain.length-1] != req.connection.remoteAddress)
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
