Package.describe({
  name: 'gadicohen:headers',
  summary: 'Access HTTP headers on both server and client',
  version: "0.0.30",
  git: 'https://github.com/gadicc/meteor-headers.git'
});

Npm.depends({
  'connect': '2.12.0'
});

Package.onUse(function(api) {
  api.versionsFrom("0.9.0");
  api.use(['webapp', 'livedata', 'deps'], ['client', 'server']);
  api.use('appcache', 'server', { weak: true });
  api.use("meteorhacks:inject-initial@1.0.2", ['server', 'client']);

  api.addFiles('lib/headers-common.js', ['client', 'server']);
  api.addFiles('lib/headers-server.js', 'server');
  api.addFiles('lib/headers-client.js', 'client');

  api.export('headers', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use(['tinytest', 'gadicohen:headers']);
  api.addFiles('tests/tests-client.js', 'client');
  api.addFiles('tests/tests-server.js', 'server');
});
