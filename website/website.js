var headersCol = new Meteor.Collection('headers');
var methodHeadersCol = new Meteor.Collection('methodHeaders');

if (Meteor.isClient) {

  /* Helpers */

  Blaze.Template.registerHelper('dstache', function() {
        return '{{';
  });

  Blaze.Template.registerHelper("markdown", new Template('markdown', function () {
    var view = this;
    var content = '';
    if (view.templateContentBlock) {
      content = Blaze._toText(view.templateContentBlock, HTML.TEXTMODE.STRING);
    }
    return HTML.Raw(marked(content));
  }));

  /* clientIP + socketIP */

  Template.clientIP.clientIP = function() {
    if (headers.ready())
      return headers.getClientIP();
    else
      return 'Loading...';
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
    if (headers.ready())
      return JSON.stringify(headers.get(), null, 2);
    else
      return 'Loading...';
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

  headers.ready(function() {
    console.log('headers are ready');
    console.log(headers);
  });

}

if (Meteor.isServer) {

  /* serverHeaders (via method call) */

  Meteor.methods({
    'headers': function() {
      //console.log(this.connection);

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

  try {
    headers.get();
    throw new Error("Ran headers.get() outside of a method/publish and"
      + "it didn't throw an error");
  } catch (error) {
    // TODO, make sure we're catching the correct error
  }

  Meteor.onConnection(function(connection) {
    //console.log(headers.methodGet({connection: connection}));
  }); 

}
