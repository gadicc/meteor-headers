# headers

Access HTTP headers on both server and client.
Confirmed working with both Meteor 0.6.4 and 0.6.5.

## On the Server

Use `headers.get()` to access HTTP headers sent by the client.
`headers.get(key)` will retrieve a specific header, e.g.
headers.get('host'), whereas headers.get() will return an object
with all headers.

Note that all header field names are *lowercase*.  e.g. 
`headers.get('accept-language')`, `headers.get('x-forwarded-for')`,
etc (like with ExpressJS [req.get](http://expressjs.com/api.html#req.get)).

See also the `getClientIP()` note below.

## On the Client

As above.  Note that the headers are sent back over the wire via a Meteor
method call, when the script is loaded.  If you try access it too early,
it won't be there, but from my own experience, it's always been available
from `Meteor.startup()` onwards.  If you have problems, let me know,
and I'll implement a callback solution.

You may wonder why the headers have to make a round trip from
client->server->client.  Unfortunately, these headers are NOT available from
the browser via Javascript.  There's a trick to make an XHR request in the
browser to get the headers, but note, this does NOT INCLUDE ALL HEADERS.
Unfortunately the ONLY reliable method, to get all headers with their correct
values, is via the server.

## getClientIP() -- freebie

Since a common use for getting the headers to is to check the client's IP
address (especially when using a proxy / loadbalancer), I threw in the most
common pattern for this.

Usage: `headers.getClientIP(proxyCount)`

`proxyCount` can be ommitted if you aren't running any proxies / caches / load balancers, otherwise it should be the number of proxies used as part of your hosting setup (i.e. that you can vouch for / trust).  It may also be ommitted if you've set proxyCount globally (see below).

Explanation: each proxy in the chain appends to the X-Forwarded-For header, such that if you know the number of proxies, you can work out the initial IP address that the first proxy
in the chain specified as the end user's IP address. Thus, even if the end-user sends a request with his own X-Forwarded-For header, you can ignore these fake IPs. In the case where the user's ISP has a transparent proxy, you'll get that proxy's IP... but that remains the only IP that you know for sure is real.  See [issue #2](https://github.com/gadicohen/meteor-headers/issues/2)

You can set *proxyCount* globally with `headers.setProxyCount(proxyCount)` (on both client
and server, depending on where you need it).  If you're writing your own smart package,
which depends on getClientIP(), you should advise your end-users about this step.  If you
need to access the value again, use `getProxyCount()`.

## References

* [List of HTTP header fields](http://en.wikipedia.org/wiki/List_of_HTTP_header_fields)
