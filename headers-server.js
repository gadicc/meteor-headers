var HEADERS_CLEANUP_TIME = 300000;  // 5 minutes

// be helpful on meteor.com
if (process.env.ROOT_URL.match(/meteor.com$/i) &&
      typeof(process.env.HTTP_FORWARDED_COUNT) == 'undefined')
    process.env.HTTP_FORWARDED_COUNT = 1;

// Since Meteor 0.7.1, replaces headers.setProxy(count);
// +1 is for our strategy of always adding the host to x-ip-chain
if (process.env.HTTP_FORWARDED_COUNT)
  headers.proxyCount = parseInt(process.env.HTTP_FORWARDED_COUNT);

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
//  if (chain.length == 0 || chain[chain.length-1] != connection.remoteAddress)
    chain.push(connection.remoteAddress);
  return chain;
}

/*
 * After user has requested the headers (which were stored in headers.list
 * at the same time with the client's token, the below is called, which we
 * use to re-associate with the user's livedata session (see above)
 */
Meteor.methods({
  'headersToken': function(token) {
  	check(token, Number);
    if (headers.list[token]) {
      var data = this.connection || this._sessionData;
      data.headers = headers.list[token];
      headerDep(data).changed();

      // Don't do this until Meteor resumes sessions.  Consider
      // longer cleanup time, and keeping last reassocation time.
      // Or on disconnect, put back in the list with disconnect
      // time and keep that for cleanup_time (can do in 0.7+).
      // delete headers.list[token];
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
 * Provide helpful hints for incorrect usage
 */
function checkSelf(self, funcName) {
  if (!self || (!self.connection && !self._session && !self._sessionData))
    throw new Error('Call headers.' + funcName + '(this) only from within a '
    	+ 'method or publish function.  With callbacks / anonymous '
    	+ 'functions, use: var self=this; and call headers.'+funcName+'(self);');
}

/*
 * Usage in a Meteor method/publish: headers.get(this, 'host')
 */
headers.get = function(self, key) {
  checkSelf(self, 'get');
  var sessionData = self.connection || (self._session ? self._session.sessionData : self._sessionData);

  headerDep(sessionData).depend();
  if (!(sessionData && sessionData.headers))
    return key ? undefined : {};

  return key
    ? sessionData.headers[key.toLocaleLowerCase()]
    : sessionData.headers;
}

headers.ready = function(self) {
  checkSelf(self, 'ready');
  var sessionData = self.connection || (self._session ? self._session.sessionData : self._sessionData);
  headerDep(sessionData).depend();
  return Object.keys(sessionData.headers).length > 0;
}

headers.getClientIP = function(self, proxyCount) {
  checkSelf(self, 'getClientIP');
  var chain = this.get(self, 'x-ip-chain').split(',');
  if (typeof(proxyCount) == 'undefined') {
    this.proxyCountDeprecated(proxyCount);
    proxyCount = this.proxyCount;
  }
  return chain[chain.length - proxyCount - 1];
}

/*
 * Retrieve header(s) for the current method socket (see README.md)
 */
headers.methodGet = function(self, header) {
  var session, headers, chain;
  checkSelf(self, 'methodGet');

  if (self.connection) {
    // Meteor 0.6.7+
    session = Meteor.server.sessions[self.connection.id];
  } else if (self._session || self._sessionData) {
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
  if (!headers['x-ip-chain'])
	  headers['x-ip-chain'] = ipChain(headers, session.socket);

  return header ? headers[header] : headers;
}

/*
 * Get the IP for the livedata connection used by a Method (see README.md)
 */
headers.methodClientIP = function(self, proxyCount) {
  checkSelf(self, 'methodClientIP');
  var chain = this.methodGet(self, 'x-ip-chain');
  if (typeof(proxyCount) == 'undefined') {
    this.proxyCountDeprecated(proxyCount);
    proxyCount = this.proxyCount;
  }
  return chain[chain.length - proxyCount - 1];
}


// What's safe + necessary to send back to the client?
var filtered = function(headers) {
  var out = {};
  var ignoreKeys = ['user-agent', 'cookie', 'authorization'];

  for (var key in headers)
    if (typeof ignoreKeys[key] === 'undefined'
        && !headers[key].match(/<\/?\s*script\s*>/i))
      out[key] = headers[key];

  return out;
}

/*
 * The client will request this "script", and send a unique token with it,
 * which we later use to re-associate the headers from this request with
 * the user's livedata session (since XHR requests only send a subset of
 * all the regular headers).
 */
WebApp.connectHandlers.use('/headersHelper.js', function(req, res, next) {
  var token = req.query.token;
  var mhData = { headers: {} };

  req.headers['x-ip-chain'] = ipChain(req.headers, req.connection).join(',');
  headers.list[token] = req.headers;
  mhData.headers = filtered(req.headers);

  if (headers.proxyCount)
    mhData.proxyCount = headers.proxyCount;

  res.writeHead(200, { 'Content-type': 'application/javascript' });
  res.end("Package['gadicohen:headers'].headers.store("
    + JSON.stringify(mhData) + ");", 'utf8');
});

// Can only inject headers w/o appcache
if (!Package.appcache)
WebApp.connectHandlers.use(function(req, res, next) {
  if(Inject.appUrl(req.url)) {
  	var mhData = {
      token: new Date().getTime() + Math.random()
    }
    if (headers.proxyCount)
      mhData.proxyCount = headers.proxyCount;

    req.headers['x-ip-chain'] = ipChain(req.headers, req.connection).join(',');
    headers.list[mhData.token] = req.headers;
    mhData.headers = filtered(req.headers);

    Inject.obj('meteor-headers', mhData, res);
  }
  next();
});

