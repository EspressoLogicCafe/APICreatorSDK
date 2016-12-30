'use strict';
var apicreator = require('./APICreatorSDK');
var api = apicreator.connect('http://localhost:8080/APIServer/rest/default/demo/v1', 'demo', 'Password1');
console.log('connected');
api.endpoint('demo:customer').get().then(function (data) {
	console.log(data);
});
