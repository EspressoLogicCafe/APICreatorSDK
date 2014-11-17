##Espresso Logic
[Espresso Logic](http://espressologic.com) is the fastest way to create REST APIs across your various data sources including SQL and NoSQL databases. You can join data across multiple data sources and write declarative/reactive programming rules that are adhered to by your REST API. Security access for resources can be as broad or granular as needed, from complete access to row and column level control. And it all deploys in the time it's taken to read about it. For more information about this SDK, please visit our [doc center](https://sites.google.com/a/espressologic.com/site/docs/live-api/node-sdk).

### Installation
The SDK library is installed as we might expect, from a simple npm install command:

```
npm install espressologic
```

### Up and Running

After installation, we invite you to give the library a try:

```javascript
var espressologic = require('espressologic');
var api = espressologic.connect('https://eval.espressologic.com/rest/livedemo/demo/v1', 'readonly');
api.endpoint('customer').get().then(function (data) {
	console.log(data);
});
```

### Getting Started

Connecting to an existing project is done via the espressologic.connect() method. Here we are connecting to a sample API which is available as a sandbox for exploring the basics:

```javascript
var espressologic, api;
espressologic = require('espressologic');

//via a username and password
api = espressologic.connect('https://eval.espressologic.com/rest/livedemo/demo/v1', 'demo', 'Password1');

//or with an API key
api = espressologic.connect('https://eval.espressologic.com/rest/livedemo/demo/v1', 'readonly');
```

Espresso builds an API around the tables and relationships it finds in your database. Once connected, your project endpoints are accessible in an easy to use format:

```javascript
var espressologic, api;
espressologic = require('espressologic');

//API endpoints follow a simple structure: {projectUrl}/{databasePrefix}:{tableName}
//a full endpoint might look like this "https://eval.espressologic.com/rest/livedemo/demo/v1/customer"
api = espressologic.connect('https://eval.espressologic.com/rest/livedemo/demo/v1', 'demo', 'Password1');

var customers;
customers = api.endpoint('customer');

customers.get().then(function (data) {
	console.log(data); //an array of objects from our customers table
});
```

The customers.get() method refers to the http request method, and PUT/POST/DELETE requests will look very similar (though, for these requests, we invite you to register for an account @ [Espresso Logic](http://www.espressologic.com/)).

```
var customers, newCustomer;
customers = api.endpoint('/customers');
alphaCustomer = {
    name: "Alpha",
    credit_limit: "1234"
};

//POST
customers.post(alphaCustomer, params).then(function (txSummary) {
	console.log(txSummary); //an array of objects updated
});

//GET
customers.get().then(function (data) {
	console.log(data); //an array which will now include customer: Alpha
	
	//objects returned include metadata specific to each record,
	//the most useful to us here is the endpoint href
    var alphaEndpoint = espressologic.endpoint(data[0]['@metadata'].href);
	
	//PUT
    	data[0].name = 'Alpha Updated';
    	alphaEndpoint.put(data[0]).then(function(txSummary) {
    	    console.log(txSummary);
	    });
	    
	//DELETE
    	alphaEndpoint.delete(data[0]).then(function(txSummary) {
    	    console.log(txSummary);
	    });
});
```