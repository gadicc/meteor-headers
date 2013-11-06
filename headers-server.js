var HEADERS_CLEANUP_TIME = 300000;  // 5 minutes

/*
 * Returns an array describing the suspected IP route the connection has taken.
 * This is in order of trust, see the README.md for which value to use
 */
function ipChain(headers, connection) {
  var chain = [];
  if (headers['x-forwarded-for'])
    _.each(headers['x-forwarded-for'].split(','), function(ip) {
      chain.push(ip.replace('/\s*/g', ''));
    });
  if (chain.length == 0 || chain[chain.length-1] != connection.remoteAddress)
    chain.push(connection.remoteAddress);
  return chain;
}

/*
 * The client will request this "script", and send a unique token with it,
 * which we later use to re-associate the headers from this request with
 * the user's livedata session (since XHR requests only send a subset of
 * all the regular headers).
 */
WebApp.connectHandlers.use('/headersHelper.js', function(req, res, next) {
  var token = req.query.token;

  req.headers['x-ip-chain'] = ipChain(req.headers, req.connection).join(',');
  headers.list[token] = req.headers;

  res.writeHead(200, { 'Content-type': 'application/javascript' });
  res.end("headers.store(" + JSON.stringify(req.headers) + ");", 'utf8');
});

/*
 * After user has requested the headers (which were stored in headers.list
 * at the same time with the client's token, the below is called, which we
 * use to re-associate with the user's livedata session (see above)
 */
Meteor.methods({
  'headersToken': function(token) {
    if (headers.list[token]) {
      this._sessionData.headers = headers.list[token];
      delete headers.list[token];
    }
  }
});

/*
 * Cleanup unclaimed headers
 */ 
Meteor.setInterval(function() {
  for (key in headers.list)
    if (parseInt(key) < new Date().getTime() - HEADERS_CLEANUP_TIME)
      delete(headers.list[key]);
}, HEADERS_CLEANUP_TIME);

/*
 * Usage in a Meteor method: headers.get(this, 'host')
 */
headers.get = function(self, key) {
  return key ? self._sessionData.headers[key] : self._sessionData.headers;
}

headers.getClientIP = function(self, proxyCount) {
  var chain = self._sessionData.headers['x-ip-chain'].split(',');
  if (typeof(proxyCount) == 'undefined')
    proxyCount = this.proxyCount;
  return chain[chain.length - proxyCount - 1];
}

/*
 * Get the IP for the livedata connection used by a Method (see README.md)
 */
headers.methodClientIP = function(self, proxyCount) {
  // convoluted way to find our session
  // TODO, open an issue with Meteor to see if we can get easier access
  var token, session;
  token = new Date().getTime() + Math.random();
  self._sessionData.tmpToken = token;
  session = _.find(Meteor.server.sessions, function(session) {
    return session.sessionData.tmpToken == token;
  });

  var chain = ipChain(session.socket.headers, session.socket);
  if (typeof(proxyCount) == 'undefined')
    proxyCount = this.proxyCount;
  return chain[chain.length - proxyCount - 1];
}
