var HEADERS_CLEANUP_TIME = 300000;  // 5 minutes

// Can only inject headers w/o appcache, and when inlineScriptsAllowed()
var INJECT_HEADERS = !Package.appcache
  && WebAppInternals.inlineScriptsAllowed();

// be helpful on meteor.com
if (process.env.ROOT_URL.match(/meteor.com$/) &&
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

/*
 * All this code is below adapted from Fast Render by Arunoda Susiripala
 * https://github.com/arunoda/meteor-fast-render/blob/master/lib/server/inject.js
 *
 */

//When a HTTP Request comes, we need to figure out is it a proper request
//then get some query data
//then hijack html return by meteor
//code below, does that in abstract way

var http = Npm.require('http');

var originalWrite = http.OutgoingMessage.prototype.write;
http.OutgoingMessage.prototype.write = function(chunk, encoding) {
  //prevent hijacking other http requests
  if(this.mhData && !this.mhInjected && 
    encoding === undefined && /<!DOCTYPE html>/.test(chunk)) {

    // Indentation same as __meteor_runtime_config__
    var injectHtml = '<script type="text/javascript">__headers__ = \n'
    	+ JSON.stringify(this.mhData) + '</script>\n';

	chunk = chunk.replace('<head>', '<head>\n' + injectHtml + '\n');
    this.mhInjected = true;
  }

  originalWrite.call(this, chunk, encoding);
};

//meteor algorithm to check if this is a meteor serving http request or not
//add routepolicy package to the fast-render
function appUrl(url) {
  if (url === '/favicon.ico' || url === '/robots.txt')
    return false;

  // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.
  if (url === '/app.manifest')
    return false;

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if (typeof(RoutePolicy) != 'undefined' && RoutePolicy.classify(url))
    return false;

  // we currently return app HTML on all URLs by default
  return true;
};

// What's safe + necessary to send back to the client?
var filtered = function(headers) {
  var filtered = _.clone(headers);
  var keys = ['user-agent', 'cookie', 'authorization'];

  // _.each() looks nicer, but is slower, and this happens on every connect
  // http://benhollis.net/blog/2009/12/13/investigating-javascript-array-iteration-performance/
  for (var i=0; i < keys.length; i++)
    if (filtered[keys[i]])
      delete(filtered[keys[i]]);

  return filtered;
}

// Check page and add mhData if relevant
// WebApp.connectHandlers.use(Npm.require('connect').cookieParser());
if (INJECT_HEADERS)
WebApp.connectHandlers.use(function(req, res, next) {
  if(appUrl(req.url)) {
  	// create a unique token to store headers for this request (see README)
  	var token = new Date().getTime() + Math.random();
  	headers.list[token] = req.headers;

  	// for the getClientIP helper
    req.headers['x-ip-chain'] = ipChain(req.headers, req.connection).join(',');

    // data to be injected into initial page HEAD (see http.outgoing... above)
    res.mhData = { headers: filtered(req.headers), token: token };

    if (headers.proxyCount)
      res.mhData.proxyCount = headers.proxyCount;

    next();
  } else {
    next();
  }
});

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
  res.end("Package.headers.headers.store("
    + JSON.stringify(mhData) + ");", 'utf8');
});
