Package.describe({
  name: 'gadicohen:headers',
  summary: 'Access HTTP headers on both server and client',
  version: "0.0.27",
  git: 'https://github.com/gadicc/meteor-headers.git'
});

Npm.depends({
  'connect': '2.12.0'
});

Package.onUse(function(api) {
  api.versionsFrom("0.9.0");
  api.use(['webapp', 'livedata', 'templating', 'deps'], ['client', 'server']);
  api.use('appcache', 'server', { weak: true });
  api.use("meteorhacks:inject-initial@1.0.2", ['server', 'client']);

  api.addFiles('headers-common.js', ['client', 'server']);
  api.addFiles('headers-server.js', 'server');
  api.addFiles('headers-client.js', 'client');

  api.export('headers', ['client', 'server']);
});
