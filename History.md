# meteor-headers changelog

## vNext

## v0.0.14

* Added a check() for `headersToken` method (fixes #12)
* Created a test/demo website (`website` dir or [headers.meteor.com](http://headers.meteor.com)

## v0.0.13

* Headers are now injected into the initial page load, so are available as
as the package loads.  All the old headers.ready() functions remain in
place for backwards compatibility, but are no longer required.

* Added `headers.methodGet()` on the server.

* Added checks to ensure that the server functions are called correctly.
Will now throw an exception with helpful information on how to fix, rather
than leaving the user wondering if it's a meteor-headers bug.

## v0.0.12

* Support for Meteor 0.6.7

## v0.0.11

* Made .get() reactive on both the client (e.g. for routing) and server
(e.g. for publish), and added a ready() method for the same reasons.
* Server: support for publish functions

## v0.0.10

* Added `headers.ready()` function to provide a callback to be run once we have
all our headers.  Useful if we want to run code once headers are available but
before the document is read.