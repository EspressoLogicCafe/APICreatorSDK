'use strict';
var apilivecreator = require('../APICreatorSDK');


//API endpoints follow a simple structure: {projectUrl}/{databasePrefix}:{tableName}
//a full endpoint might look like this "http://eval.apilivecreator.com/rest/livedemo/demo/v1/customer"

var api = apilivecreator.connect('http://{myservername}/rest/{projecturl}/{project}/v1', 'demo', 'Password1');

//LIST OF All PROJECT TABLES & COLUMNS
var tables = api.endpoint('@tables');///*?projectId=1001') returns all tables and collumns for project
var tblname;
tables.get().then(function (data) {
	//console.log(data);
	for( var idx in data){
    	console.log('Table: '+data[idx].name); //an array of objects from our customers table
    	tblname = data[idx].name;
		var columns =  api.endpoint('@tables/'+tblname); //<< hard coded - should use name for each
		columns.get().then(function(colData){
			//console.log(colData);
			console.log('Table '+tblname);
			for(var col in colData.columns){
				console.log('ColName: '+ colData.columns[col].name);
			}
		})
	}
});


//LIST OF All PROJECT RESOURCES

var resources =  api.endpoint('@resources');
resources.get().then(function(data){
	//console.log(data);
	for(var col in data){
		console.log('Resource: '+data[col].name);
	}
});

var views =  api.endpoint('@views');
views.get().then(function(data){
	//console.log(data);
	for(var col in data){
		console.log('Views: '+data[col].name);
	}
});

//LIST OF All PROJECT STORED PROCEDURES

var procs =  api.endpoint('@procedures');
procs.get().then(function(data){
	//console.log(data);
	for(var col in data){
		console.log('Procedure: '+data[col].name);
		console.log('Procedure: '+data[col].remarks);
	}
});

//LIST OF All PROJECT RULES

var rules =  api.endpoint('@rules');
rules.get().then(function(data){
	//console.log(data);
	for(var col in data){
		console.log('Rule Entity: '+data[col].entityName);
		console.log('Rule Column: '+data[col].columnName);
		console.log('Rule Description: '+data[col].bestName);
	}
});

//LIST OF All PROJECT SWAGGER DOC
var doc =  api.endpoint('@docs');
doc.get().then(function(data){
	//console.log(data);
	for(var col in data.apis){
		console.log('doc Path: '+data.apis[col].path);
	}
});

