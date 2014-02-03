var headersCol = new Meteor.Collection('headers');
var methodHeadersCol = new Meteor.Collection('methodHeaders');

if (Meteor.isClient) {

  if (__meteor_runtime_config__.ROOT_URL == "http://headers.meteor.com")
    headers.setProxyCount(1);

  /* Helpers */

  Handlebars.registerHelper('dstache', function() {
        return '{{';
  });

  Handlebars.registerHelper('markdown', function(options) {
        return marked(options.fn(this));
  });

  /* clientIP + socketIP */

  Template.clientIP.clientIP = function() {
    return headers.getClientIP();
  }

  Session.setDefault('socketIP', 'Loading...');
  Template.clientIP.socketIP = function() {
    return Session.get('socketIP');
  }
  Meteor.startup(function() {
    Meteor.call('socketIP', function(error, data) {
      Session.set('socketIP', data);
    });
  });

  /* clientHeaders */

  Template.clientHeaders.headers = function() {
    return JSON.stringify(headers.get(), null, 2);
  }

  /* serverHeaders (via method call) */

  Meteor.startup(function() {
    Meteor.call('headers', function(error, data) {
      Session.set('headers', data);
    });
    Meteor.call('methodHeaders', function(error, data) {
      Session.set('methodHeaders', data);
    });
  });

  Session.setDefault('headers', 'Loading...');
  Session.setDefault('methodHeaders', 'Loading...');

  Template.serverMethod.headers = function() {
    var headers = Session.get('headers');
    return JSON.stringify(headers, null, 2);
  }

  Template.serverMethod.methodHeaders = function() {
    var headers = Session.get('methodHeaders');
    return JSON.stringify(headers, null, 2);
  }

  /* serverHeaders (via publish) */

  Template.serverPublish.headers = function() {
    return headersCol.find().fetch();
  }
  Template.serverPublish.methodHeaders = function() {
    return methodHeadersCol.find().fetch();
  }

  Meteor.subscribe('headers');
  Meteor.subscribe('methodHeaders');

}

if (Meteor.isServer) {

  if (process.env.ROOT_URL == "http://headers.meteor.com")
    headers.setProxyCount(1);

  /* serverHeaders (via method call) */

  Meteor.methods({
    'headers': function() {
      return headers.get(this);
    },
    'methodHeaders': function() {
      return headers.methodGet(this);
    },
    socketIP: function() {
      return headers.methodClientIP(this);
    }
  });

  /* serverHeaders (via publish) */

  Meteor.publish('headers', function() {
    var data = headers.get(this);
    for (key in data)
      this.added('headers', Random.id(), {
        key: key, value: data[key]
      });
  });

  Meteor.publish('methodHeaders', function() {
    var data = headers.methodGet(this);
    for (key in data)
      this.added('methodHeaders', Random.id(), {
        key: key, value: data[key]
      });
  });


}
