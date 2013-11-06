# headers

Access HTTP headers on both server and client.
For Meteor < 0.6.5, you need to use meteor-headers 0.0.7.

## On the Client

Use `headers.get()` to access HTTP headers sent by the client.
`headers.get(key)` will retrieve a specific header, e.g.
headers.get('host'), whereas headers.get() will return an object
with all headers.

Note that all header field names are *lowercase*.  e.g. 
`headers.get('accept-language')`, `headers.get('x-forwarded-for')`,
etc (like with ExpressJS [req.get](http://expressjs.com/api.html#req.get)).

Guaranteed to be available once the document is ready.
See the notes below on how we do this, and also about `getClientIP()`.

## On the Server

Available in Meteor methods (let me know where else you might need them).
As above, but you need to pass `this` as the first argument.  e.g.
`headers.get(this)` or `headers.get(this, 'host')`.

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

There are a number of stages to the approach we've taken:

*On client load, we request another script from the server, with a unique token*

We'd love to avoid another round-trip to the server, but unfortunately this
is essential.  Headers are NOT available from
the browser via Javascript.  There's a trick to make an XHR request in the
browser to get the headers, but note, this does NOT INCLUDE ALL HEADERS.
Unfortunately the ONLY reliable method, to get all headers with their correct
values, that the client sends to the server, is via the server.

This is the same reason why we can't rely on the headers available on the
open socket (sockjs / websocket), as used in `methodClientIP()`.  Additionally,
the script returns the values straight away, and will be available as soon as
the document ready callbacks are fired.  Why the unique token?  See below.

*After the headers are retrieved, send our unique token via livedata*

Livedata keeps an (undocumented but hopefully permanent) sessionData variable
per session.  This is where we store our headers on the server side, so they
are available in Meteor methods (with the correct headers per client).  Since
the initial pageload is not part of a session, we use the token to associate
the correct data with the header (see source for details).

## References

* [List of HTTP header fields](http://en.wikipedia.org/wiki/List_of_HTTP_header_fields)
