# meteor-headers changelog

## vNEXT

## v0.0.27

* Fix XSS vulnerability where in-line code could be injected via headers.
  We now drop headers that include <script> or </script> tags (#36)

## v0.0.26

* Fixes for appcache on Meteor 0.9+ (#31)
* Thanks @dandv for misc PRs and helpful issues (#32, #33, #34)

## v0.0.25

* Bump `inject-initial` dep.  Upgrade `website` for 0.9.  (#28)

## v0.0.24

* Bump `inject-initial` to v0.0.8

## v0.0.22

* Removed console.log() from client headers.getClientIP() (#25)

## v0.0.21

* Outsource inject code to inject-initial package.
* Store headers in a META tag rather than inline script, to work with
  browserPolicy.content.disallowInlineScripts().
* Various minor fixes related to the above

## v0.0.17

* License under the GPLv3 (#21)
* Make headers.get() case insensitive, just like in ExpressJS (#20)
* Don't needlessly send user-agent back to client (use navigator.userAgent)

Thanks to [https://github.com/Nemo64 Nemo64] for discussing on
these issues.

## v0.0.16

* Don't send cookies back to client (#18).
* Use old method when browser-policy disallowInlineScripts() set (#19)
or when using appcache (#11) - requires headers.ready() on client again
in these situations.
* Deprecate setting proxyCount via meteor-headers.  Use the
HTTP_FORWARDED_COUNT environment variable by default (like 0.7.1+),
and display a deprecation warning.

Thanks are due to [https://github.com/Nemo64 Nemo64] for #18 and #19.

## v0.0.15

* Added test for calling `headers.get()` without a valid contect from a
publish / method.
* Added code to check if our workaround for onConnect works, see
https://github.com/gadicohen/meteor-headers/issues/14#issuecomment-34243329.

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
