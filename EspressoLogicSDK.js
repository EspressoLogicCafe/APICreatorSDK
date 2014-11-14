module.exports = (function () {
	var SDK, Q, http, https, _, querystring;
	Q = require('Q');
	http = require('http');
	https = require('https');
	URL = require('url');
	_ = require('underscore');
	querystring = require('querystring');

	SDK = {
		/**
		* The base project url. This attribute is initialized during a SDK.connect(url, ...) method
		*/
		url: null,

		/**
		* The plain API key.
		* This attribute is initialized during a SDK.connect(url, ...) method,
		* either from having been passed directly, or after a username/password request has succeeded.
		*/
		apiKey: null,

		/**
		* The username passed to SDK.connect(url, username, password)
		*/
		username: null,

		/**
		* The password passed to SDK.connect(url, username, password)
		*/
		password: null,

		/**
		* The url object resulting from URL.parse(url).
		* After SDK.connect() succeeds, additional parameters are added (ex: SDK.params.headers)
		*/
		params: null, //produced by _.pick(URL.parse(url), 'host', 'path', 'port')

		/**
		* The promise set by SDK.connect(), used internally to verify an API key exists
		* before making requests
		*/
		connection: null,

		/**
		* A placeholder or the node packages http and https.
		* If the project is accessible through https, req is updated during SDK.connect()
		*/
		req: http,
		
		/**
		* Default request headers set for SDK.endpoint() methods [get(), post(), put(), del()]
		*/
		headers: {'X-EspressoLogic-ResponseFormat':'json', 'Content-Type':'application/json'},
		
		/**
		* Default filters supplementing an SDK.endpoint().get(filters) request
		*/
		filters: {},
		
		/**
		* The endpoint for a user to authenticate
		*/
		authEndpoint: '/@authentication',

		/**
		* Convenience function testing a string for ":"
		*/
		isUrlWithPort: function (host) {
			return host.match('\:');
		},

		/**
		* Convenience function for retrieving the first element of a url that include a port
		*/
		stripUrlPort: function (host) {
			return host.split(':')[0];
		},

		/**
		* Removes the first and last "/"
		*/
		stripWrappingSlashes: function (str) {
			return str.replace(/^\/|\/$/g, '');
		},

		/**
		* The default method of connecting to an Espresso API. Returns an instance of this library
		* and initializes a promise used to make requests on API endpoints.
		*
		* @param string url the Espresso API url base
		* @param string key an API key, typically found in Logic Designer's Security section. When connecting
		* with a username/password, this second argument is a username
		* @param string password an optional argument when using espressologic.connect() with a user/password combination 
		*/
		connect: function (url, key, password) {
			var deferred, options, headers, espresso;
			espresso = this;
			this.url = this.stripWrappingSlashes(url);
			this.params = _.pick(URL.parse(url), 'host', 'path', 'port');
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
						espresso.apiKey = data.apikey;
						espresso.params.headers.Authorization = 'Espresso ' + data.apikey + ':1';
						deferred.resolve();
					});
				});
				req.end(JSON.stringify({username: key, password: password}));

				req.on('error', function(e) {
					deferred.reject('Authentication failed, please confirm the username and/or password');
				});
			} else {
				//espressologic.connect() was directly passed an API key
				this.apiKey = key;
				this.params.headers.Authorization = 'Espresso ' + key + ':1';
				deferred.resolve();
			}

			return _.extend({}, SDK);
		},

		/**
		* Internal method used to merge default espressologic.params options with those passed in via params
		*/
		setOptions: function (params, override) {
			if (!override) {
				override = {};
			}
			return _.extend(params, this.params, override);
		},

		/**
		* Internal method for merging espressologic.headers attributes with those passed in via headers.
		*
		* @param object options a collection of URL.parse(url) attributes, which may or may not contain options.headers
		* @param object headers a collection of header attributes to be appended to the request
		*/
		setHeaders: function (options, headers) {
			if (!headers) { headers = {}; }
			if (options.headers) {
				var headers = options.headers;
				headers = _.extend(headers, this.headers, headers);
			}
			return options;
		},

		/**
		* Internal method for merging espressologic.filters attributes with those passed in via filters
		*/
		setFilters: function (filters) {
			filters = _.extend({}, this.filters, filters);
			return filters;
		},

		/**
		* A convenience function for setting the default pagesize filter. Overriden by filters passed to endpoint objects.
		*/
		setPageSize: function (num) {
			this.filters.pagesize = num;
		},

		/**
		* A method for stringifying a filters collection
		*/
		formatFilters: function (filters) {
			if (filters) {
				filters = querystring.stringify(filters);
			}
			else {
				filters = this.setFilters({});
				filters = querystring.stringify(filters);
			}
			return filters;
		},

		/**
		* The default method used to make requests to specific endpoints.
		* espressologic.endpoint() returns an endpoint object with the following methods:
		* espressologic.endpoint().get(filters, headers) - returning a promise of a GET request
		* espressologic.endpoint().post(data, filters, headers) - returning a promise of a POST request
		* espressologic.endpoint().put(data, filters, headers) - returning a promise of a PUT request
		* espressologic.endpoint().del(data, filters, headers) - returning a promise of a DELETE request
		*/
		endpoint: function (endpoint, options) {
			var url, urlParams, prefix;
			urlParams = {};
			url = '';
			prefix = '';
			if (endpoint.substr(0) != '/') {
				url = URL.parse(endpoint);
				if (url && url.host) {
					urlParams = _.pick(URL.parse(url), 'host', 'path', 'port');
					endpoint = '';
					if (SDK.isUrlWithPort(urlParams.host)) {
						urlParams.host = SDK.stripUrlPort(urlParams.host);
					}
				}
				else {
					prefix = '/';
					endpoint = prefix + this.stripWrappingSlashes(endpoint);
				}
			}

			var espresso = this;

			return {
				get: function (filters, headers) {
					var deferred;
					deferred = Q.defer();
					filters = espresso.formatFilters(filters);
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'GET'}, urlParams);
						options = espresso.setHeaders(options, headers);

						options.path += endpoint;
						if (filters) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = espresso.req.request(options, function (res) {
							var data = '';
							res.setEncoding('utf8');
							res.on('data', function (chunk) {
								if (chunk) {
									data += chunk;
								}
							});
							res.on('end', function (info) {
								data = JSON.parse(data);
								if (res.statusCode > 299) {
									//response codes 300+ indicate an error
									deferred.reject(data);
								}
								else {
									//status ok
									deferred.resolve(data);
								}
							});
						});
						req.end();

						req.on('error', function(e) {
							deferred.reject(e);
						});

					});
					return deferred.promise;
				},

				put: function (body, filters, headers) {
					var deferred;
					deferred = Q.defer();
					filters = espresso.formatFilters(filters);
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'PUT'}, urlParams);
						options = espresso.setHeaders(options, headers);
						options.path += endpoint;
						if (filters) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = espresso.req.request(options, function (res) {
							var data = '';
							res.setEncoding('utf8');
							res.on('data', function (chunk) {
								if (chunk) {
									data += chunk;
								}
							});
							res.on('end', function (info) {
								data = JSON.parse(data);
								if (res.statusCode > 299) {
									//response codes 300+ indicate an error
									deferred.reject(data);
								}
								else {
									//status ok
									deferred.resolve(data);
								}
							});
						});
						req.end(JSON.stringify(body));

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},

				post: function (body, filters, headers) {
					var deferred;
					deferred = Q.defer();
					filters = espresso.formatFilters(filters);
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'POST'}, urlParams);
						options = espresso.setHeaders(options, headers);
						options.path += endpoint;
						if (filters) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = espresso.req.request(options, function (res) {
							var data = '';
							res.setEncoding('utf8');
							res.on('data', function (chunk) {
								if (chunk) {
									data += chunk;
								}
							});
							res.on('end', function (info) {
								data = JSON.parse(data);
								if (res.statusCode > 299) {
									//response codes 300+ indicate an error
									deferred.reject(data);
								}
								else {
									//status ok
									deferred.resolve(data);
								}
							});
						});
						req.end(JSON.stringify(body));

						req.on('error', function(e) {
							deferred.reject(e);
						});
					});
					return deferred.promise;
				},

				del: function (body, filters, headers) {
					var deferred;
					deferred = Q.defer();
					if (!filters) {filters = {};}
					filters.checksum = body['@metadata'].checksum;
					filters = espresso.formatFilters(filters);
					espresso.connection.then(function () {
						var options;
						options = espresso.setOptions({method: 'DELETE'}, urlParams);
						options = espresso.setHeaders(options, headers);
						options.path += endpoint;
						if (filters) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = espresso.req.request(options, function (res) {
							var data = '';
							res.setEncoding('utf8');
							res.on('data', function (chunk) {
								if (chunk) {
									data += chunk;
								}
							});
							res.on('end', function (info) {
								data = JSON.parse(data);
								if (res.statusCode > 299) {
									//response codes 300+ indicate an error
									deferred.reject(data);
								}
								else {
									//status ok
									deferred.resolve(data);
								}
							});
						});
						//req.end(JSON.stringify(body));
						req.end();

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