module.exports = (function () {
	var SDK, Q, http, https, _, querystring;
	Q = require('Q');
	http = require('http');
	https = require('https');
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
		req: http,
		headers: {'X-EspressoLogic-ResponseFormat':'json'},
		filters: {},
		authEndpoint: '/@authentication',

		isUrlWithPort: function (host) {
			return host.match('\:');
		},
		stripUrlPort: function (host) {
			return host.split(':')[0];
		},
		stripWrappingSlashes: function (str) {
			return str.replace(/^\/|\/$/g, '');
		},

		/**
		*
		*/
		connect: function (url, key, password) {
			var deferred, options, headers;
			this.url = this.stripWrappingSlashes(url);
			this.params = _.pick(this.url.parse(url), 'host', 'path', 'port');
			this.params.headers = {};

			if (url.match('https')) {
				this.req = https;
			}

			//passed a url with a defined port
			if (this.isUrlWithPort(this.params.host)) {
				this.params.host = this.stripUrlPort(this.params.host);
			}
			deferred = Q.defer();
			this.connection = deferred.promise;

			//Is this a username/password combo
			if (password) {
				options = this.setOptions({method: 'POST'});
				options.path += this.authEndpoint;
				var req = this.req.request(options, function (res) {
					if (res.statusCode == 503) {
						deferred.reject(res.statusCode);
					}
					res.setEncoding('utf8');
					res.on('data', function (data) {
						data = JSON.parse(data);
						this.apiKey = data.apikey;
						this.params.headers.Authorization = 'Espresso ' + data.apikey + ':1';
						deferred.resolve();
					});
				});
				req.end(JSON.stringify({username: key, password: password}));

				req.on('error', function(e) {
					deferred.reject('Authentication failed, please confirm the username and/or password');
				});
			} else {
				//SDK.connect was directly passed an API key
				this.apiKey = key;
				this.params.headers.Authorization = 'Espresso ' + key + ':1';
				deferred.resolve();
			}

			return _.extend({}, SDK);
		},

		setOptions: function (params, override) {
			if (!override) {
				override = {};
			}
			return _.extend(params, this.params, override);
		},

		setHeaders: function (options) {
			if (options.headers) {
				var headers = options.headers;
				headers = _.extend(headers, this.headers);
			}
			return options;
		},

		setFilters: function (filters) {
			headers = _.extend(filters, this.filters);
			return options;
		},

		setPageSize: function (num) {
			this.filters.pagesize = num;
		},

		endpoint: function (endpoint, options) {
			var url, urlParams, prefix;
			prefix = '';
			if (endpoint.substr(0) == '/') {
				prefix = '/';
			}
			endpoint = prefix SDK.stripWrappingSlashes(endpoint);
			url = URL.parse(endpoint);
			urlParams = {};
			if (url && url.host) {
				urlParams = _.pick(URL.parse(url), 'host', 'path', 'port');
				if (SDK.isUrlWithPort(urlParams.host)) {
					urlParams.host = SDK.stripUrlPort(urlParams.host);
				}
			}
			var espresso = this;

			return {
				get: function (filters) {
					var deferred;
					deferred = Q.defer();
					if (filters) {
						filters = espresso.setFilters(filters);
						filters = querystring.stringify(filters);
					}
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'GET'}, urlParams);
						options = espresso.setHeaders(options);

						options.path += endpoint;
						options.search = '?' + filters;
						var req = espresso.req.request(options, function (res) {
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
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'PUT'}, urlParams);
						options = espresso.setHeaders(options);
						options.path += endpoint;
						var req = espresso.req.request(options, function (res) {
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
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'POST'}, urlParams);
						options = espresso.setHeaders(options);
						options.path += endpoint;
						var req = espresso.req.request(options, function (res) {
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
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'DELETE'}, urlParams);
						options = espresso.setHeaders(options);
						options.path += endpoint;
						var req = espresso.req.request(options, function (res) {
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