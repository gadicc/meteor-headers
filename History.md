# meteor-headers changelog

## vNext

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