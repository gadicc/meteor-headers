# headers

Access HTTP headers on both server and client

## On the Server

The `reqHeaders` variable is made available.  All headers (both the key and
value) are lowercase.  e.g. `reqHeaders.host`, etc.

## On the Client

As above.  Note that the headers are sent back over the wire via a Meteor
method call, when the script is loaded.  You may want to check if `reqHeaders`
is not null before using it, although anywhere from `Meteor.startup()` onwards
it should be there.  If not, let me know, and I'll implement a callback
solution.

You may wonder why the headers have to make a round trip from
client->server->client.  Unfortunately, these headers are NOT available from
the browser via Javascript.  There's a trick to make an XHR request in the
browser to get the headers, but note, this does NOT INCLUDE ALL HEADERS.
Unfortunately the ONLY reliable method, to get all headers with their correct
values, is via the server.
