##Espresso Logic
[Espresso Logic](http://espressologic.com) is the fastest way to create REST APIs across your various data sources including SQL and NoSQL databases. You can join data across multiple data sources and write declarative/reactive programming rules that are adhered to by your REST API. Security access for resources can be as broad or granular as needed, from complete access to row and column level control. And it all deploys in the time it's taken to read about it. For more information about this SDK, please visit our [doc center](https://sites.google.com/a/espressologic.com/site/docs/live-api/node-sdk).

### Installation
The SDK library is installed as we might expect, from a simple npm install command:

```
npm install espressologic
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

### Using Node.js to Create a Database connection, create a Resource, and Add Reactive Logic (Metadata API)

```javascript
//API endpoints follow a simple structure: {projectUrl}/{databasePrefix}:{tableName} to retrieve data from your service
//a full endpoint might look like this "https://eval.espressologic.com/rest/livedemo/demo/v1/customer"

//this is the meta api used to create and manage the creation of a project, database, resources, and rules
//use the servername and password sent to you when you created a new appliance or cloud account.
var espressologic = require('./EspressoLogicSDK');
var serverName = 'http://{myservername}/rest/abl/admin/v2';
var userName = 'admin';
var password = 'mypassword';
var api = espressologic.connect(serverName, userName, password);


//create  or find your project ID and set the global value
var projects = api.endpoint('AllProjects?pagesize=100');
projects.get().then(function(data){
	for(var idx in data){
		console.log('ProjectName: '+data[idx].name + " Project ident "+data[idx].ident);
	}
});
var project_ident = 1001;
var params = {};

//	dbasetype_ident
//	1	MySQL			MySQL Database
//	2	Oracle			Oracle (Thin driver)
//	3	SQLServer(jTDS)	Microsoft SQL Server(jTDS - obsolete)
//	5	SQLServer		Microsoft SQL Server
//	6	AzureSQL		Windows Azure SQL
//	7	NuoDB (beta)	NuoDB - beta
//	8	PostgreSQL		Postgres (beta)

//create a new connection to our project
var dbschema = api.endpoint('/DbSchemas');
var json = {"name":"My New database","url":"jdbc:mysql://<hostname>/<db-name>","user_name":"jdoe","active":false,"project_ident":project_ident,"dbasetype_ident":1}
dbschema.post(json, params).then(function (txSummary) {
    console.log(txSummary); //an array of objects updated
});

//create a new resource
var resource = api.endpoint('/AllResources');
var json = {"resource_type_ident":1,"apiversion_ident":project_ident,"name":"MyNewCustomerResource","prefix":"demo","table_name":"customer","is_collection":"Y"};
resource.post(json, params).then(function (txSummary) {
    console.log(txSummary); //an array of objects updated
});
//add child resource - using root_ident from prior txSummary - remember to add join as childColumn = [parentColumn]
var subresource = api.endpoint('/AllResources');
var json ={"apiversion_ident":project_ident,"resource_type_ident":1,"name":"NewChildResource","prefix":"demo","table_name":"orders", "join_condition": "customerID=[customerId]","is_collection":"Y","root_ident":1086,"container_ident":1086};
subresource.post(json, params).then(function (txSummary) {
    console.log(txSummary); //an array of objects updated
});

//	ruletype_ident
//	1	sum				sum child attr into parent
//	2	count			count child attr into parent
//	3	formula			formula using table & parent attributes
//	4	parent copy		non-cascaded parent value
//	5	validation		multi-attribute validation
//	6	commit validation	multi-attribute validation after all rows
//	7	event			extensible event
//	8	early event		extensible event before rule execution
//	9	commit event	extensible event after all rows
//	11	minimum			replicate the minimum value from a child attribute
//	12	maximum			replicate the maximum value from a child attribute
//	13	managed parent	create a parent if it does not exist//declare validation and derivation rules.

//add SUM on Customer
var  sumrule  = api.endpoint('/AllRules');
var json = {"ruletype_ident":1,"entity_name":"demo:customer","project_ident":project_ident,"attribute_name":"balance","rule_text1":"purchaseorderList","rule_text3":"amount_total","active":true};
sumrule.post(json, params).then(function (txSummary) {
    console.log(txSummary); //an array of objects updated
});
//Add Validation Check on Credit Limit
var validationRule = api.endpoint('/AllRules');
var json = {"ruletype_ident":5,"entity_name":"demo:customer","attribute_name": null,"project_ident":project_ident,"prop4": "javascript","rule_text1": "return row.balance <= row.credit_limit;","rule_text2": "Customer {name}'s balance: {balance|#,##0.00} exceeds their credit limit: {credit_limit|#,##0.00}","active":true};
validationRule.post(json, params).then(function (txSummary) {
    console.log(txSummary); //an array of objects updated
});


```
