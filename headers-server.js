headers = {
	list: {},
	get: function(header) {
		return header ? this.list[header] : this.list;
	}
};

var app = typeof WebApp != 'undefined' ? WebApp.connectHandlers : __meteor_bootstrap__.app;
app.use(function(req, res, next) {
    headers.list = req.headers;
    return next();
});

Meteor.methods({
    'getReqHeader': function(header) {
    	return headers.list[header];
    },
    'getReqHeaders': function() {
    	return headers.list;
    }
});
