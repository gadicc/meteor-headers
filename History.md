# meteor-headers changelog

## vNext

## v0.0.10

* Added `headers.ready()` function to provide a callback to be run once we have
all our headers.  Useful if we want to run code once headers are available but
before the document is read.