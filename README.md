# headers

Access HTTP headers on both server and client (+ clientIP funcs).

For Meteor < 0.6.5, you need to use meteor-headers 0.0.7.

[2014-02-18] Note, for Meteor >= 0.7.1, you are advised to use the
`this.connection` object to access headers on the server
You can still use the old way, but soon they
will generate a warning.  (Currently DDP headers "methodHeaders" only).
Set the `HTTP_FORWARDED_COUNT` environment
variable to the value you previously used for `headers.setProxyCount()`.

Since 0.0.13, headers are sent down with the initial page access
and are available immediately (see below).

For a working demo, see [headers.meteor.com](http://headers.meteor.com/).

## On the Client

Use `headers.get()` to access HTTP headers sent by the client.
`headers.get(key)` will retrieve a specific header, e.g.
headers.get('host'), whereas headers.get() will return an object
with all headers.

Note that all header field names are *lowercase*.  e.g. 
`headers.get('accept-language')`, `headers.get('x-forwarded-for')`,
etc (like with ExpressJS [req.get](http://expressjs.com/api.html#req.get)).

**Since 0.0.13, headers are available as soon as the package is loaded,
i.e. before any of your app code is run.  The below is still supported
for backwards compatibility purposes but is no longer required.**

Queue callbacks that will be run as soon as headers are available
(i.e. immediately since 0.0.13):

```js
headers.ready(function() {
	console.log(headers.get());
});
```

It's confusing, but `headers.ready()` called without any arguments
is a reactive `ready()` function which could be used in all the usual
places (e.g. with iron-router's waitOn).  `headers.get()` is reactive
too.  You can use this for example with iron-router to ensure that
the headers are available before the first route is executed (no
longer required since 0.0.13):

```js
  Router.map(function() {
    this.route('/', {
      template: 'hello',
      loadingTemplate: 'loading',
      waitOn: headers,
      action: function() {
        // Will only be happen once.  Without the waitOn, you'll see it happens
        // twice, once before headers are ready, and once after they've arrived.
        console.log(headers.get());
      }
    })
  });
```

For more info see the relevant sections in the iron-router docs.

See the notes below on how we retrieve the headers, why it's necessary
to do it this way, and also the note about `getClientIP()`.


## On the Server

As above, but you need to pass `this` as the first argument.  e.g.
`headers.get(this)` or `headers.get(this, 'host')`, and likewise,
`headers.ready(this)`.  For callbacks / anonymous functions, use
`var self=this;` and call `headers.get(self)` from within the func.

Available in Meteor methods and publish functions.  There is no way
to do this for Collection allow/denies unfortunately (but since that
relies on a userId, you could use your own logic to set the latest
headers per userId)`


Note, `headers.get()` will always provide the headers for the
INITIAL CONNECTION and not the headers for the current connection
of the open socket, which is used for publish/methods.  Use
`headers.methodGet(this)` to get those headers.

## getClientIP() -- freebie

Since a common use for getting the headers to is to check the client's IP
address (especially when using a proxy / loadbalancer), I threw in the most
common pattern for this.

Usage: `headers.getClientIP([proxyCount])`

`proxyCount` can be ommitted if you aren't running any proxies / caches / load balancers, otherwise it should be the number of proxies used as part of your hosting setup (i.e. that you can vouch for / trust).  It may also be ommitted if you've set proxyCount globally (see below).

Explanation: each proxy in the chain appends to the X-Forwarded-For header, such that if you know the number of proxies, you can work out the initial IP address that the first proxy
in the chain specified as the end user's IP address. Thus, even if the end-user sends a request with his own X-Forwarded-For header, you can ignore these fake IPs. In the case where the user's ISP has a transparent proxy, you'll get that proxy's IP... but that remains the only IP that you know for sure is real.  See [issue #2](https://github.com/gadicohen/meteor-headers/issues/2)

You can set *proxyCount* globally with `headers.setProxyCount(proxyCount)` (on both client
and server, depending on where you need it).  If you're writing your own smart package,
which depends on getClientIP(), you should advise your end-users about this step.  If you
need to access the value again, use `getProxyCount()`.

### methodClientIP() -- server only

Usage: `var ip = headers.methodClientIP(this, [proxyCount]);` (inside a Meteor method)

IP address of client connected to the socket over which the Method is running.

## How and why this all works

Intro: headers **have to** come from the server.  Headers are NOT available
from the browser via Javascript.  There's a trick to make an XHR request in the
browser to get the headers, but note, this does NOT INCLUDE ALL HEADERS (see
which headers at [headers.meteor.com](http://headers.meteor.com/).
Unfortunately the ONLY reliable method, to get all headers with their correct
values, that the client sends to the server, is via the server.

1. On the initial request, all headers are returned on the initial page
load and loaded on the client (injected into the HEAD, before even
loading meteor-headers client side code).  The headers are also returned
with a unique token generated for each request.

2. When client code is loaded, we use a meteor method to send the above
token back to the server, where we can reassociate the headers from the
original request to the current socket.  This allows for headers.get()
(as opposed to headers.methodGet) to return the correct data, which is
kept in the connection session (maintained by livedata).

## References

* [List of HTTP header fields](http://en.wikipedia.org/wiki/List_of_HTTP_header_fields)
* [Issue #786: this.hostname](https://github.com/meteor/meteor/issues/786)
* [Issue #1624: Client address & headers](https://github.com/meteor/meteor/issues/1624)
