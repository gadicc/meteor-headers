reqHeaders = null;

var app = typeof WebApp != 'undefined' ? WebApp.connectHandlers : __meteor_bootstrap__.app;
app.use(function(req, res, next) {
    reqHeaders = req.headers;
    return next();
});

Meteor.methods({
    'getReqHeader': function(header) {
    	return reqHeaders[header];
    },
    'getReqHeaders': function() {
    	return reqHeaders;
    }
});
