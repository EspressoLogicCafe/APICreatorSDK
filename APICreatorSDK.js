module.exports = (function () {
	var SDK, Q, http, https, _, querystring;
	Q = require('q');
	http = require('http');
	https = require('https');
	URL = require('url');
	_ = require('underscore');
	querystring = require('querystring');

	SDK = {
		/**
		* 	CA Live API Creator SDK from CA Technologies, Inc.  2017 (c)
		*/
		debug: false,
		/**
		* The base project url. This attribute is initialized during a SDK.connect(url, ...) method
		*/
		url: null,

		/**
		* The plain Auth Token (apikey).
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
		headers: {'X-liveapicreatorLogic-ResponseFormat':'json', 'Content-Type':'application/json'},
		
		/**
		* Default filters supplementing an SDK.endpoint().get(filters) request - e.g. sysfilter=equal(colname:value)
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
			if (!host) { return host; }
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
		* The default method of connecting to an API. Returns an instance of this library
		* and initializes a promise used to make requests on API endpoints.
		*
		* @param string url the API url base e.g. http://localhost:8080/rest/default/demo/v1
		* @param string key an API key, typically found in Logic Designer's Security section. 
		 * When connecting  with a username/password, this second argument (key) is a username
		 * When connecting with an APIKey - set the password to null or omit.
		* @param string password an optional argument when using liveapicreatorsdk.connect() with a user/password combination 
		*/
		connect: function (url, key, password) {
			var deferred, options, headers, liveapicreator;
			liveapicreator = _.extend({}, SDK);
			liveapicreator.url = this.stripWrappingSlashes(url);
			liveapicreator.params = _.pick(URL.parse(url), 'host', 'path', 'port');
			liveapicreator.params.headers = {};


			if (url.match('https')) {
				liveapicreator.req = https;
			}

			//passed a url with a defined port
			if (liveapicreator.isUrlWithPort(liveapicreator.params.host)) {
				liveapicreator.params.host = liveapicreator.stripUrlPort(liveapicreator.params.host);
			}
			deferred = Q.defer();
			liveapicreator.connection = deferred.promise;

			//Is this a username/password combo
			if (password) {
				options = liveapicreator.setOptions({method: 'POST'});
				options.headers['Content-Type'] ='application/json';
				options.path += liveapicreator.authEndpoint;
				var req = liveapicreator.req.request(options, function (res) {
					if (res.statusCode == 503) {
						deferred.reject(res.statusCode);
					}
					res.setEncoding('utf8');
					res.on('data', function (data) {
						data = JSON.parse(data);
						liveapicreator.apiKey = data.apikey;
						liveapicreator.params.headers.Authorization = 'CALiveAPICreator ' + data.apikey + ':1';
						deferred.resolve();
					});
				});
				req.end(JSON.stringify({username: key, password: password}));

				req.on('error', function(e) {
					deferred.reject('Authentication failed, please confirm the username and/or password');
				});
			} else {
				//liveapicreatorsdk.connect() was directly passed an API key
				liveapicreator.apiKey = key;
				liveapicreator.params.headers.Authorization = 'CALiveAPICreator ' + key + ':1';
				deferred.resolve();
			}
			return liveapicreator;
		},

		log: function (output) {
			if (this.debug) {
				console.log(output);
			}
		},

		/**
		* Internal method used to merge default liveapicreatorsdk.params options with those passed in via params
		*/
		setOptions: function (params, override) {
			if (!override) {
				override = {};
			}
			return _.extend(params, this.params, override);
		},

		/**
		* Internal method for merging liveapicreatorsdk.headers attributes with those passed in via headers.
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
		* Internal method for merging liveapicreatorsdk.filters attributes with those passed in via filters
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
		* A method for stringifying a filters collection - use urlutils.js to escape your filters before sending 
		*/
		formatFilters: function (filters) {
			//if (typeof filters == "string") {
			//	return filters.replace(" ", "%20");
			//}
			//if (filters) {
			//	filters = querystring.stringify(filters);
			//}
			//else {
			//	filters = this.setFilters({});
			//	filters = querystring.stringify(filters);
			//}
			return filters;
		},

		/**
		* The default method used to make requests to specific endpoints.
		* use urlutils.js to encode path and query segment.
		* liveapicreatorsdk.endpoint() returns an endpoint object with the following methods:
		* liveapicreatorsdk.endpoint().get(filters, headers) - returning a promise of a GET request
		* liveapicreatorsdk.endpoint().post(data, filters, headers) - returning a promise of a POST request
		* liveapicreatorsdk.endpoint().put(data, filters, headers) - returning a promise of a PUT request
		* liveapicreatorsdk.endpoint().del(data, filters, headers) - returning a promise of a DELETE request
		*/
		endpoint: function (endpoint, options) {
			var url, urlParams, prefix;
			urlParams = {};
			url = '';
			prefix = '';
			if (url && url.path && url.host) {
				 urlParams = _.pick(URL.parse(url), 'host', 'path', 'port');
				 //endpoint = '';
				 if (this.isUrlWithPort(urlParams.host)) {
					 urlParams.host = this.stripUrlPort(urlParams.host);
				 }
			 }
			/*
			if (endpoint.substr(0) != '/') {
				url = URL.parse(endpoint);
				//is this possibly a full url?
				if (url && url.path && url.host) {
					urlParams = _.pick(URL.parse(url), 'host', 'path', 'port');
					endpoint = '';
					if (this.isUrlWithPort(urlParams.host)) {
						urlParams.host = this.stripUrlPort(urlParams.host);
					}
					this.log("1. endpoint = "+endpoint);
				}
				else {
					prefix = '/';
					endpoint = prefix + this.stripWrappingSlashes(endpoint);
					this.log("2. endpoint = "+endpoint);
				}
			}
			*/
			endpoint = "/" + this.stripWrappingSlashes(endpoint);
			var liveapicreator = this;

			return {
				get: function (filters, headers) {
					var deferred;
					deferred = Q.defer();
					filters = liveapicreator.formatFilters(filters);
					liveapicreator.connection.then(function () {
						var options;
						options = liveapicreator.setOptions({method: 'GET'}, urlParams);
						options = liveapicreator.setHeaders(options, headers);

						options.path +=  endpoint;
						if (filters && filters.length > 0) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = liveapicreator.req.request(options, function (res) {
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
					filters = liveapicreator.formatFilters(filters);
					liveapicreator.connection.then(function () {
						var options;
						options = liveapicreator.setOptions({method: 'PUT'}, urlParams);
						options = liveapicreator.setHeaders(options, headers);
						options.path += endpoint;
						if (filters && filters.length > 0) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = liveapicreator.req.request(options, function (res) {
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
					deferred = Q.defer();;
					filters = liveapicreator.formatFilters(filters);
					liveapicreator.connection.then(function () {
						var options;
						options = liveapicreator.setOptions({method: 'POST'}, urlParams);
						options = liveapicreator.setHeaders(options, headers);
						options.path += endpoint;
						if (filters && filters.length > 0) {
							options.path += '?' + filters;
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = liveapicreator.req.request(options, function (res) {
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
					liveapicreator.connection.then(function () {
						var options;
						options = liveapicreator.setOptions({method: 'DELETE'}, urlParams);
						options = liveapicreator.setHeaders(options, headers);
						
						options.path += endpoint;
						if (filters && filters.length > 0) {
							options.path += '?' + filters;
						} else {
							if(body && body.hasOwnProperty('@metadata')) {
								options.path += '?' + "checksum="+body['@metadata'].checksum;
							}
						}
						options.path = options.path.replace(/\%27/g, "'");
						var req = liveapicreator.req.request(options, function (res) {
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
						//req.end();

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