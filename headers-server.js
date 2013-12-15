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
  res.end("Package.headers.headers.store(" + JSON.stringify(req.headers) + ");", 'utf8');
});

/*
 * After user has requested the headers (which were stored in headers.list
 * at the same time with the client's token, the below is called, which we
 * use to re-associate with the user's livedata session (see above)
 */
Meteor.methods({
  'headersToken': function(token) {
    if (headers.list[token]) {
      var data = this.connection || this._sessionData;
      data.headers = headers.list[token];
      headerDep(data).changed();
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
 * Return the headerDep.  Create if necessary.
 */
function headerDep(obj) {
  if (!obj.headerDep)
    obj.headerDep = new Deps.Dependency();
  return obj.headerDep;
}

/*
 * Usage in a Meteor method/publish: headers.get(this, 'host')
 */
headers.get = function(self, key) {
  if (!self)
    throw new Error('Must be called like this on the server: headers.get(this)');
  var sessionData = self.connection || (self._session ? self._session.sessionData : self._sessionData);
  headerDep(sessionData).depend();
  if (!(sessionData && sessionData.headers))
    return key ? undefined : {};
  return key ? sessionData.headers[key] : sessionData.headers;
}

headers.ready = function(self) {
  if (!self)
    throw new Error('Must be called like this on the server: headers.get(this)');
  var sessionData = self.connection || (self._session ? self._session.sessionData : self._sessionData);
  headerDep(sessionData).depend();
  return Object.keys(sessionData.headers).length > 0;
}

headers.getClientIP = function(self, proxyCount) {
  if (!self)
    throw new Error('Must be called like this on the server: headers.getClientIP(this)');
  var chain = this.get(self, 'x-ip-chain').split(',');
  if (typeof(proxyCount) == 'undefined')
    proxyCount = this.proxyCount;
  return chain[chain.length - proxyCount - 1];
}

/*
 * Get the IP for the livedata connection used by a Method (see README.md)
 */
headers.methodClientIP = function(self, proxyCount) {
  var session, headers, chain;
 
  if (self.connection) {
    // Meteor 0.6.7+
    session = Meteor.server.sessions[self.connection.id];
  } else {
    // convoluted way to find our session in Meteor < 0.6.7
    var sessionData = self._session ? self._session.sessionData : self._sessionData;
    var token, session;
    token = new Date().getTime() + Math.random();
    sessionData.tmpToken = token;
    session = _.find(Meteor.server.sessions, function(session) {
      return sessionData.tmpToken == token;
    });
  }

  headers = session.socket.headers;
  chain = ipChain(headers, session.socket);
  if (typeof(proxyCount) == 'undefined')
    proxyCount = this.proxyCount;
  return chain[chain.length - proxyCount - 1];
}

