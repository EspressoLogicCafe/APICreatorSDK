// arguments are optional - meanings (defaults listed first)
// arg[2] is derby or mysql
// arg[3] is http://localhost:8080/rest/default
// eg, from b2b folder: node ./scs/projects/test/node/empGiveRaiseFunction.js derby http://localhost:8080/rest/default
// Using the Jetty sample - create a Northwind demo sample and change the url prefix to 'nw'
//Example: $node empGiveRaiseFunction.js derby http://localhost:8080/rest/default/nw/v1

var apicreator = require('../APICreatorSDK');
var urlutils = require('../urlutil');

// essentially: return apicreator.connect(urlNwAPI, 'demo', 'Password1');
console.log(process.argv[3]);
var api = apicreator.connect(
       // "B2B - checking Employee giveRaise (update) function, verify it worked for emp #1",
        process.argv[3],
        "demo",
        "Password1"
    );

var empsEP = api.endpoint('nw:Employees');

try {
    empsEP.get('sysfilter=equal(EmployeeID:1)').then(function (data) {
        console.log("..Employees response returned, checking LastName... ");
        // console.log(data); // lots of output
        if (data.length == 0) {
            console.log("** Alert not found - response...");
            console.log(data);
        }
        var theEmp = data[0];
        if (theEmp.LastName == "Davolio") {
            console.log("....found Davolio");
        }
        else {
            console.log("** Expected values not found, employee from get...");
            console.log(theEmp);
            process.exit(1);
        }
        var oldSalary = theEmp.Salary;
        var raise = oldSalary * .1;
        var expectedSalary = oldSalary + raise;
        console.log("....giving raise [" + oldSalary + "] => [" + expectedSalary + "]...");
        try {
            // endPt is the url before the '?'
            var empsEP2 = api.endpoint('nw:Employees/1/giveRaise');
            empsEP2.get('percentRaise=10').then( function (data) {
                console.log("......gave Raise, data: " + JSON.stringify(data));
            }).catch(function(reason) {
            	//console.log(empsEP2.endpoint);
            	console.log(empsEP2.filters);
                console.log("ERROR: giveRaise promise failed, reason..." + reason);
            }
            );
        }
        catch (err) {
            console.log("ERROR: giveRaise failed, err..." + err);
            process.exit(1);
        };
    });
}
catch(err) {
    console.log("ERROR: get failed, err..." + err);
    process.exit(1);
};
