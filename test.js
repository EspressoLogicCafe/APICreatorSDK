'use strict';
var apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');

var api = apicreator.connect('http://localhost:8080/APIServer/rest/default/demo/v1', 'demo', 'Password1');

console.log('api connected t0 server');

var customers, alphaCustomer,  params;
customers = api.endpoint('demo:customer');
var custname =  "Alpha"+ (String(new Date())).substr(17);
alphaCustomer = {
    name: custname,
    credit_limit: "1000"
};
console.log("==========GET Example ==============");
api.endpoint('demo:customer').get().then(function (data) {
	console.log("s/b 21: "+ data.length);
});

//Nested POST -> PUT -> GET -> DELETE
customers.post(alphaCustomer).then(function (txSummary) {
   console.log("POST statusCode s/b 201 = "+ txSummary.statusCode); //txSummary an array of objects updated
   //use urlutil on query segment encode
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
/*
console.log("==========GET Example ==============");
api.endpoint('demo:customer').get().then(function (data) {
	console.log("s/b 21: "+ data.length);
});
api.endpoint('demo:employee/1').get().then(function (data) {
        console.log("s/b = 1 "+ data.length);
});
console.log("======use urlutil on query segment encode====");
var filter = urlquery.encodeQuerySegment("equal(name:'Juliet Dating Inc.')");
api.endpoint('demo:customer').get("sysfilter="+filter).then(function (data) {
        console.log(data);
});
console.log("==========POST Example ==============");
var customers, alphaCustomer;
customers = api.endpoint('demo:customer');
alphaCustomer = {
    name: "Alpha "+ (String(new Date())).substr(17),
    credit_limit: "1000"
};
console.log(">>>>>Post TX Summary " + JSON.stringify(alphaCustomer));
var params = {};
customers.post(alphaCustomer, params).then(function (txSummary) {
	console.log(txSummary.statusCode); //s/b 201
	console.log(txSummary); //an array of objects updated
}).then(undefined, console.error);

console.log("==========PUT Example ==============");
//find the record first to get the checksum (required by PUT)
var filter = urlquery.encodeQuerySegment("equal(name:'Juliet Dating Inc.')");
var customer = api.endpoint('demo:customer');
customer.get("sysfilter="+filter).then(function (data) {
        customer = api.endpoint('/demo:customer');
        data[0].credit_limit = data[0].credit_limit + 1;
        console.log(data[0]);
       	customer.put(data[0], {}).then(function (txSummary) {
			console.log(txSummary.statusCode); //s/b 201
			console.log(txSummary); //an array of objects updated
		}).then(undefined, console.error);
});

console.log("==========DELETE Example ==============");
//remember - this will delete the selected record and cascade to related orders.
var emp = api.endpoint('demo:employee/4');
emp.get().then(function (data) {
        var emp4 = api.endpoint('demo:employee/4');
        console.log(data);
        var checksum = "checksum="+data[0]["@metadata"].checksum;
        console.log("checksum = "+checksum);
       	emp4.del(data[0], checksum).then(function (txSummary) {
			console.log(txSummary.statusCode); //s/b 200
			console.log(txSummary);//list of all related files xSummary.txSummary
		}).then(undefined, console.error);
}).then(undefined, console.error);
*/