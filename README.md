##Espresso Logic
[Espresso Logic](http://espressologic.com) is the fastest way to create REST APIs with your data. You can join data across multiple data sources, write declartive rules, and define granular security for an API that deploys in the time it takes to scan the schema!

### Installation
After registering for a free account @ http://espressologic.com, our node SDK library can be implemented for use via the install command

```
npm install espressologic
```

### Getting Started

Connecting to an existing project is as easy as:

```javascript
//via a username and password
espressologic.connect('http://eval.espressologic.com/rest/demo', 'username', 'password');

//or with an API key
espressologic.connect('http://eval.espressologic.com/rest/demo', 'apiKeyHere');
```

Espresso builds an API around the tables and relationships it finds in your database. Once connected, your project endpoints are accessible in an easy to use format:

```javascript
//API endpoints follow a simple structure: {projectUrl}/{databasePrefix}:{tableName}
//a full endpoint might look like this "http://eval.espressologic.com/rest/demo/db:table"
espressologic.connect('https://eval.espressologic.com/rest/demo', 'username', 'password');

var customers;
customers = espressologic.endpoint('/db:customers');

customers.get().then(function (data) {
	console.log(data); //an array of objects from our customers table
});
```

The customers.get() method refers to the http request method, so PUT/POST/DELETE requests look very similar.

```
var customers, newCustomer;
customers = espressologic.endpoint('/demo:customers');
alphaCustomer = {
    name: "Alpha",
    credit_limit: "1234"
};

//PUT
customers.put(alphaCustomer, params).then(function (txSummary) {
	console.log(txSummary); //an array of objects updated
});

//GET
customers.get().then(function (data) {
	console.log(data); //an array which will now include customer: Alpha
	
	//objects returned include metadata specific to each record,
	//the most useful to us here is the endpoint href
    var alphaEndpoint = espressologic.endpoint(data[0]['@metadata'].href);
	
	//POST
    	data[0].name = 'Alpha Updated';
    	alphaEndpoint.post(data[0]).then(function(txSummary) {
    	    console.log(txSummary);
	    });
	    
	//DELETE
    	alphaEndpoint.delete(data[0]).then(function(txSummary) {
    	    console.log(txSummary);
	    });
});
```