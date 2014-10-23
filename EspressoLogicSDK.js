module.exports = (function () {
	var SDK, Q, http, _, querystring;
	Q = require('Q');
	http = require('http');
	URL = require('url');
	_ = require('underscore');
	querystring = require('querystring');

	SDK = {
		url: null,
		apiKey: null,
		username: null,
		password: null,
		params: null, //produced by _.pick(URL.parse(url), 'host', 'path', 'port')
		connection: null,
		authEndpoint: '/@authentication',

		isUrlWithPort: function (host) {
			return host.match('\:');
		},
		stripUrlPort: function (host) {
			return host.split(':')[0];
		},

		/**
		*
		*/
		connect: function (url, key, password) {
			var deferred, options, headers;
			SDK.url = url;
			SDK.params = _.pick(URL.parse(url), 'host', 'path', 'port');
			SDK.params.headers = {};

			//passed a url with a defined port
			if (SDK.isUrlWithPort(SDK.params.host)) {
				SDK.params.host = SDK.stripUrlPort(SDK.params.host);
			}
			deferred = Q.defer();
			SDK.connection = deferred.promise;

			//Is this a username/password combo
			if (password) {
				options = SDK.setOptions({method: 'POST'});
				options.path += SDK.authEndpoint;
				var req = http.request(options, function (res) {
					if (res.statusCode == 503) {
						deferred.reject(res.statusCode);
					}
					res.setEncoding('utf8');
					res.on('data', function (data) {
						data = JSON.parse(data);
						SDK.apiKey = data.apikey;
						SDK.params.headers.Authorization = 'Espresso ' + data.apikey + ':1';
						deferred.resolve();
					});
				});
				req.end(JSON.stringify({username: key, password: password}));

				req.on('error', function(e) {
					deferred.reject('Authentication failed, please confirm the username and/or password');
				});
			} else {
				//SDK.connect was directly passed an API key
				SDK.apiKey = key;
				SDK.params.headers.Authorization = 'Espresso ' + key + ':1';
				deferred.resolve();
			}

			return SDK.connection;
		},

		setOptions: function (params, override) {
			if (!override) {
				override = {};
			}
			return _.extend(params, SDK.params, override);
		},

		endpoint: function (endpoint, options) {
			var url, urlParams;
			url = URL.parse(endpoint);
			urlParams = {};
			if (url && url.host) {
				urlParams = _.pick(URL.parse(url), 'host', 'path', 'port');
				if (SDK.isUrlWithPort(urlParams.host)) {
					urlParams.host = SDK.stripUrlPort(urlParams.host);
				}
			}

			return {
				get: function (filters) {
					var deferred;
					deferred = Q.defer();
					if (filters) {
						filters = querystring.stringify(filters);
					}
					SDK.connection.then(function () {
						var options;
						options = SDK.setOptions({method: 'GET'}, urlParams);

						options.path += endpoint;
						options.search = '?' + filters;
						var req = http.request(options, function (res) {
							res.setEncoding('utf8');
							res.on('data', function (data) {
								deferred.resolve(data);
							});
						});
						req.end();

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},

				put: function (body, params) {
					var deferred;
					deferred = Q.defer();
					SDK.connection.then(function () {
						var options;
						options = SDK.setOptions({method: 'PUT'}, urlParams);
						options.path += endpoint;
						var req = http.request(options, function (res) {
							res.setEncoding('utf8');
							res.on('data', function (data) {
								deferred.resolve(data);
							});
						});
						req.end(body);

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},

				post: function (body, params) {
					var deferred;
					deferred = Q.defer();
					SDK.connection.then(function () {
						var options;
						options = SDK.setOptions({method: 'POST'}, urlParams);
						options.path += endpoint;
						var req = http.request(options, function (res) {
							res.setEncoding('utf8');
							res.on('data', function (data) {
								deferred.resolve(data);
							});
						});
						req.end(JSON.stringify(body));

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},

				del: function (body, params) {
					var deferred;
					deferred = Q.defer();
					SDK.connection.then(function () {
						var options;
						options = SDK.setOptions({method: 'DELETE'}, urlParams);
						options.path += endpoint;
						var req = http.request(options, function (res) {
							res.setEncoding('utf8');
							res.on('data', function (data) {
								deferred.resolve(data);
							});
						});
						req.end(JSON.stringify(body));

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},
			};
			return deferred.promise;
		},
	};
	return SDK;
})();