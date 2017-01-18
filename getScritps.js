var apicreator = require('./APICreatorSDK');
var urlquery = require('./urlutil');
//setup your server and source and target project information
var server = 'http://localhost:8080/APIServer';
var source_project = 'demo'; //Source Project url fragment
var target_project = 'test';// Target Project url fragment
var project_prefix = 'demo';//Source Project Datasource prefix
var target_prefix = "ldgiw"; //Managed Data Server Datasource Prefix on Target Project

//connect to project and get list of all tables using prefix
var api = apicreator.connect(server + '/rest/default/' + source_project + '/v1', 'demo', 'Password1');

console.log("#STEP 1 export schema");
console.log('lac login -u demo -p Password1 '+ server + '/rest/default/' + source_project + '/v1');
console.log("lac schema export --prefix "+project_prefix +" --file SCHEMA.JSON");

var tables = api.endpoint('@tables');
tables.get().then(function (data) {
	console.log("#STEP 2 Export Source Data as JSON Files");
	for(var idx = 0; idx < data.length; idx++) {
		var name =  data[idx].entity;
		var entity_prefix = data[idx].prefix;
		if(project_prefix === entity_prefix) {
			console.log("lac get " + name + " -m json -z 999 -i 999999 -n true -j DATA_"+name);
		}
	}
	console.log("lac logout");
	

	console.log("#STEP 3 Export source project ");
	console.log("lacadmin login -u admin -p Password1 "+server);
	console.log("lacadmin project use --url_name "+source_project);
	console.log("lacadmin project export --file PROJECT_"+source_project+".json");
	console.log("lacadmin project use --url_name "+target_project);
	console.log("#if you are switching databases - include these flags in Schema Create");
	console.log("# --ignoredbcolumntype true");
	console.log("# --ignoreprimarykeyname true");
	console.log("#STEP 4 PHASE 1 - SCHEMA CREATE TABLES ");
	console.log("#### OPTIONAL lacadmin project import --file PROJECT_"+source_project+".JSON");
	console.log("#Create a managed datasource ans use this for your --prefix below");
	console.log("lacadmin schema create --skipRelationships true --skipTableCreation false --ignoredbcolumntype false --ignoreprimarykeyname false --file SCHEMA.json --prefix "+target_prefix);
	//START IMPORT PROCESS HERE
	console.log('lac login -u demo -p Password '+ server + '/rest/default/' + target_project + '/v1');

	console.log("#STEP 5 Import Data into Target Project");
	for(var idx = 0; idx < data.length; idx++) {
		var name =  data[idx].entity;
		var entity_prefix = data[idx].prefix;
		if(project_prefix === entity_prefix) {
			console.log("lac post " + name + " -f DATA_" + name);
		}
	}
	console.log("#if you are switch databases - include these flags in Schema Create");
	console.log("# --ignoreconstraintname true");
	console.log("#STEP 6 PHASE 2 - SCHEMA CREATE RELATIONSHIPS");
	console.log("lacadmin schema create --skipRelationships false --skipTableCreation true --ignoreconstraintname false --file SCHEMA.json --prefix "+target_prefix);
	console.log("lacadmin logout");
	console.log("lac logout");

})

