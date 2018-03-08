##CA Live API Creator NodeJS SDK
[CA Live API Creator](http://transform.ca.com/CA-Live-API-Creator.html) 
Create low-code APIs and microservices with enterprise-grade security and top-class speed and agility. 
For more information about this SDK, please visit our [doc center](https://docops.ca.com/ca-live-api-creator/4-1/en/invoking-apis/use-node-sdk/).

### Node and SDK Installation
Make sure you have installed and configured NodeJS first. The SDK library is installed as we might expect, from a simple npm install command:
Note: (MAC users may need to do sudo npm install APICreatorSDK -g)

```
npm install APICreatorSDK -g

```

### Up and Running

After installation, we invite you to give the library a try. Here we're connecting to a local project, but the data and API are all real:

```javascript
'use strict';
var apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');
var api = apicreator.connect('http://localhost:8080/rest/default/demo/v1', 'demo', 'Password1');
api.endpoint('demo:customer').get().then(function (data) {
	console.log(data);
});
```

Use the urlutil.js library to encode the query segement (e.g. replace characters).
```javascript
'use strict';
var apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');
console.log("======use urlutil on query segment encode====");
var filter = urlquery.encodeQuerySegment("equal(name:'Juliet Dating Inc.')");
api.endpoint('demo:customer').get("sysfilter="+filter).then(function (data) {
        console.log(data);
});
```

### Getting Started

Connecting to an existing project is done via the apicreator.connect() method. Here we are connecting to a sample API 
which is available as a sandbox for exploring the basics:

```javascript
var apicreator, api;
apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');

//via a username and password
api = apicreator.connect('https://localhost:8080/rest/default/demo/v1', 'demo', 'Password1');

//or with an API key
api = apicreator.connect('https://localhost:8080/rest/default/demo/v1', 'readonly');
```

API Creator can build an API around the tables and relationships it finds in your database. 
Once connected, your API endpoints are accessible in an easy to use REST calls:

```javascript
var apicreator, api;
apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');

//API endpoints follow a simple structure: http[s]://{projectUrl[:port]}/rest/default/{project_url}/{version}/{endpoint}?[filter]
//a full endpoint might look like this "https://eval.acme.com/rest/livedemo/demo/v1/customer"
api = apicreator.connect('https://localhost:8080/rest/default/demo/v1', 'demo', 'Password1');

var employee;
employee = api.endpoint('demo:employee/1');
employee.get().then(function (data) {
	console.log(data); //an array of 1 object from the employee table using employee key "1"
});
```

The customers.get() method refers to the http request method, and PUT/POST/DELETE requests will look very similar (though, for these requests, we invite you to register for a free download @ [CA Live API Creator](https://www.ca.com/us/trials/ca-live-api-creator.register.html)).

```
var api = apicreator.connect('http://localhost:8080/rest/default/demo/v1', 'demo', 'Password1');

var customers, alphaCustomer;
customers = api.endpoint('demo:customer');
var custname =  "Alpha"+ (String(new Date())).substr(17);
alphaCustomer = {
    name: custname,
    credit_limit: "1000"
};
//POST requires JSON data payload.
//PUT requires JSON with @metadata.checksum (used by optimisitic locking)
//DELETE requires passing in the key as part of the endpoint and a checksum value
customers.post(alphaCustomer).then(function (txSummary) {
   console.log("POST statusCode s/b 201 = "+ txSummary.statusCode); //txSummary an array of objects updated
   //use urlutil on query segment to encode sysfilter
   var filter = "sysfilter="+urlquery.encodeQuerySegment("equal(name:'"+custname+"')");
   customers.get(filter).then(function (data) {
		data[0].name = 'Alpha';
		//console.log(data); //an array which will now include customer: Alpha
	 	var alphaEndpoint = api.endpoint("demo:customer/Alpha");
	 	alphaEndpoint.put(data[0]).then(function(txSummary) {
			console.log("PUT statusCode s/b 200 = "+ txSummary.statusCode);
			alphaEndpoint.get().then(function(data) {
				//console.log(data);
				console.log("GET data array of 1 = "+ data.length);
		    	var checksum = "checksum="+data[0]["@metadata"].checksum;
				//console.log("Get "+JSON.stringify(data[0]));
				alphaEndpoint.del(data[0],checksum).then(function(txSummary) {
					//console.log(txSummary);
					console.log("DELETE statusCode s/b 200 = "+ txSummary.statusCode);
				}).then(undefined, console.error);
			}).then(undefined, console.error);
	 	}).then(undefined, console.error);
   	}).then(undefined, console.error);
}).then(undefined, console.error);
POST statusCode s/b 201 = 201
PUT statusCode s/b 200 = 200
GET data array of 1 = 1
DELETE statusCode s/b 200 = 200
```
