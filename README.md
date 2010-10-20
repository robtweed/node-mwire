# node-mwire
 
Extension to redis-node, for accessing GT.M and Cach&#233; Globals (via M/Wire interface)

Thanks to Brian Noguchi for advice on extending his redis-node client

Rob Tweed <rtweed@mgateway.com>  
29 September 2010, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/mdb-community-forum](http://groups.google.co.uk/group/mdb-community-forum)

## Installing node-mwire

       npm install node-mwire

You must also install redis-node:

       npm install redis-node
	   
		
##  GT.M and Cach&#233; Globals?

GT.M and Cach&#233; are relatively little-known, but extremely versatile, high-performance NoSQL databases.  They both store data in sparse hierarchical array-like structures known as "Globals".  These are extremely flexible: unlike other NoSQL databases that are designed with one particular storage model in mind, Global-based databases are more like a "Swiss Army Knife of databases".  You can use Globals to store simple key/value pairs, tabular data (cf BigTable, SimpleDB, Cassandra), documents (cf CouchDB, MongoDB) or more complex data such as graphs or DOMs.  GT.M and Cach&#233; use sophisticated mechanisms for automatically ensuring that the data you require most frequently is cached in memory: you get in-memory key/value store performance with the security and integrity of an on-disk database.

For more background on Globals, you should read [http://www.mgateway.com/docs/universalNoSQL.pdf](http://www.mgateway.com/docs/universalNoSQL.pdf)

GT.M is a particularly attractive option as it is available as a Free Open Source version.

I've developed *node-mwire* to make it possible for the growing Node.js community to benefit from the great flexibility and performance that these Global-based databases provide. The combination of Node.js and Globals is truly remarkable, and I'm hoping node-mwire will result in them becoming much better known for NoSQL database storage.


##  Installing the Global-based back-end System

In order to use *node-mwire* you'll need to have a have a Cach&#233; system or a Linux system with GT.M installed.  You'll also need to install the following on the GT.M or Cach&#233; system:

- M/Wire routines (latest versions from the repository: *robtweed/mdb*)

I've provided specific instructions for Cach&#233; at the end of this README file.  If you'd prefer to use the Free Open Source GT.M database, read on:

The easiest way to get a GT.M system going is to use Mike Clayton's *M/DB installer* for Ubuntu Linux which will create you a fully-working environment within a few minutes.  You can optionally also use his Node.js installer to add Node.js, redis-node and node-mwire to the same server.  Node.js and node-mwire can reside on the same server as GT.M or on a different server, but Mike's installer is a quick and painless way to get a complete test environment up and running on the one server.

You can apply Mike's installer to a Ubuntu Linux system running on your own hardware, or running as a virtual machine.  However, I find Amazon EC2 servers to be ideal for trying this kind of stuff out.  I've tested it with both Ubuntu 10.4 and 10.10.

So, for example, to create an M/DB Appliance using Amazon EC2:

- Start up a Ubuntu Lucid (10.04) instance, eg use ami-6c06f305
- Now follow the instructions for installing the M/DB Appliance at [http://gradvs1.mgateway.com/main/index.html?path=mdb/mdbDownload](http://gradvs1.mgateway.com/main/index.html?path=mdb/mdbDownload)

Now install Node.js, node-mdbm, redis-node and node-mwire:

      cd /tmp
      wget http://michaelgclayton.s3.amazonaws.com/mgwtools/node-mdbm-1.10_all.deb (Fetch the installer file)
      sudo node-mdbm-1.10_all.deb (Ignore the errors that will be reported)
      sudo apt-get -f install (and type y when asked)
	  
Note - the Node.js build process can take quite a long time and is very verbose.
	
OK! That's it all installed. You should now be ready to try out node-mwire!

## Testing node-mdbm

If you used Mike Clayton's installers as described above:

  In */usr/local/gtm/ewd* create a file named *test1.js* containing:
  
    var redis = require("redis-node");
    var client = redis.createClient(6330);
    require("mwire").addCommands(client);
	
    client.version(function (err, json) {
      if (err) throw err;
       console.log("Build = " + json.Build + "; date=" + json.Date + "; zv=" + json.Host);
      client.close(); 
    });
	
Now run it (from within */usr/local/gtm/ewd*).  If everything is working properly, you should see:

    ubuntu@domU-12-31-39-09-B8-03:/usr/local/gtm/ewd$ node test1.js
    Build = Build 6 Beta; date=15 October 2010; zv=GT.M V5.4-000A Linux x86_64

If this is what you get, then you have Node.js successfully communicating with your GT.M database.
	
## Running node-mwire

To use node-mdbm in your Node.js applications, you must add:

         var redis = require("redis-node");
         var client = redis.createClient(6330, '127.0.0.1');
         require("mwire").addCommands(client);
	
By default, the back-end M/Wire routines in GT.M and/or Cach&#233; listen on port 6330.
	
(*If you are using a self-contained M/DB Appliance-based system, the host should be 127.0.0.1, but you can access a remote GT.M system from Node.js by specifying its IP Address or Domain Name.  Note that in order to access a remote GT.M system using node-mwire you must install the routines from the robtweed/mdb repository on the GT.M system*)
	
Now you can use any of the node-mwire APIs.


## APIs

- setGlobal (sets a Global node, using the specified subscripts and data value)
- getGlobal (gets a Global node, using the specified subscripts)
- setJSON   (maps a JSON object to a Global)
- getJSON   (returns a JSON object from Global storage)
- kill      (deletes a Global node, using the specified subscripts)
- getGlobalList  (returns an array of Global names that exist in your database)
- getNextSubscript     (returns the next subscript at a specified level of Global subscripting)
- getPreviousSubscript     (returns the next subscript at a specified level of Global subscripting)
- getAllSubscripts  (returns an array containing all subscript values below a specified level of subscripting)
- increment (Atomically increments a Global node, using the specified subscripts)
- decrement (Atomically decrements a Global node, using the specified subscripts)
- remoteFunction   (Execute a function within the GT.M or Cach&#233; system and return the response)
- transaction   (Execute a sequence of Global manipulations in strict order, specified as an array of setJSON and kill JSON documents.)
- version   (returns the M/Wire build number and date)

With the exception of *version*, the APIs follow the same pattern:

## Commands

- client.version(function(error, results) {});

    Returns the current build number and date in the results object:
	
	    results.Build = build number  
	    results.Date = build date
	
	
- client.setGlobal(GlobalName, subscripts, value, function(error, results) {});
	
	Sets a Global node:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the subscripts ('' if value to be set at top of Global)
	    eg ["a","b","c"]
	value = the data value to be set at the specified Global node
	
	Returns ok=true if successful, ie:
	
       results.ok = true

- client.getGlobal(GlobalName, subscripts, function(error, results) {});

	Gets the value for a Global node:
	
	GlobalName = name of Global (literal)  
	subscripts = optional array specifying the subscripts ('' if value at top of Global to be returned)
	    eg ["a","b","c"]
	
	Returns the value (if any) and the status of the specified node
	
       results.value
	   results.dataStatus
	   
	   If the specified node does not exist, results.dataStatus = 0 and results.value = ''
	   If the specified node exists, has lower-level subscripts but no data value, results.dataStatus = 10 and results.value = ''
	   If the specified node exists, has lower-level subscripts has a data value, results.dataStatus = 11 and results.value = the value of the node
	   If the specified node exists, has no lower-level subscripts and has a data value, results.dataStatus = 1 and results.value = the value of the node
	   
- client.setJSON(GlobalName, subscripts, json, deleteBeforeSave, function(error, results) {});

    Maps the specified JSON object and saves it into a Global node.  The JSON object can be saved into the top node of a Global, or merged under a specified subscript level within a Global.  Optionally you can clear down any existing data at the specified Global node.  The default is the new JSON object gets merged with existing data in the Global.
	
	GlobalName = name of Global (literal)  
	subscripts = optional array specifying the subscripts ('' if JSON to be stored at top level of Global)
	    eg ["a","b","c"]
	json = the JSON object to be saved (object literal)  
	deleteBeforeSave = true|false (default = false)
	
	Returns ok=true if successful, ie:
	
       results.ok = true
	   
- client.getJSON(GlobalName, subscripts, function(error, results) {});

    Gets the data stored at and under the specified Global node, and maps it to a JSON object before returning it.
	
	GlobalName = name of Global (literal)  
	subscripts = optional array specifying the subscripts ('' if JSON to be stored at top level of Global)
	    eg ["a","b","c"]

	
	Returns the JSON object as results
	
       results = returned JSON object
	   
- client.kill(GlobalName, subscripts, function(error, results) {});
	
	Deletes a Global node and the sub-tree below it:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the subscripts ('' if the entire Global is to be deleted)
	    eg ["a","b","c"]
	
	Returns ok=true if successful, ie:
	
       results.ok = true
	
- client.getGlobalList(function(error, results) {});

    Returns an array of Global Names in your database (ie results):

	
- client.getNextSubscript(GlobalName, subscripts, function(error, results) {});
	
	Gets the next subscript value (if any) in collating sequence at the specified level of subscripting, following the last specified subscript:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the subscripts ('' if the first 1st subscript is to be returned)
	    eg ["a","b","c"]  will return the value of the 3rd subscript the follows the value "c" where subscript1 = "a" and subscript2 = "b"
	
	Returns:
	
	    results.subscriptValue = the value of the next subscript
		results.dataStatus = the data status at the next subscript:
					10 = no data at the next subscripted node but child subscripts exist
					11 = data at the next subscripted node, and child subscripts exist
					1  = data at the next subscripted node, but no child subscripts exist
		results.dataValue = the value (if any) at the next subscript

- client.getPreviousSubscript(GlobalName, subscripts, function(error, results) {});
	
	Gets the previous subscript value (if any) in collating sequence at the specified level of subscripting, preceding the last specified subscript:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the subscripts ('' if the last 1st subscript is to be returned)
	    eg ["a","b","c"]  will return the value of the 3rd subscript the precedes the value "c" where subscript1 = "a" and subscript2 = "b"
	
	Returns:
	
	    results.subscriptValue = the value of the previous subscript
		results.dataStatus = the data status at the previous subscript:
					10 = no data at the previous subscripted node but child subscripts exist
					11 = data at the previous subscripted node, and child subscripts exist
					1  = data at the previous subscripted node, but no child subscripts exist
		results.dataValue = the value (if any) at the previous subscript

- client.getAllSubscripts(GlobalName, subscripts, function(error, results) {});
	
	Gets all the values of the subscripts that exist below the specified subscript(s):
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the required subscripts ('' if all 1st subscript values are to be returned)
	    eg ["a","b","c"]  will return an array of all subscripts that exist below this level of subscripting
		
	
	Returns:
	
	    results = array of all subscripts found immediately below the specified Global node.

- client.increment(GlobalName, subscripts, delta, function(error, results) {});
	
	Atomically increments the speficied Global node by the specified amount.  If the node does not exist, it is created and its initial value is assumed to be zero:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the required subscripts ('' if the top-level Global node is to be incremented)
	    eg ["a","b","c"] 
	delta: the amount by which the specified Global node is to be incremented (default = 1)	
	
	Returns:
	
	    results.value = the new value of the incremented node

- client.decrement(GlobalName, subscripts, delta, function(error, results) {});
	
	Atomically decrements the speficied Global node by the specified amount.  If the node does not exist, it is created and its initial value is assumed to be zero:
	
	GlobalName = name of Global (literal)  
	subscripts = array specifying the required subscripts ('' if the top-level Global node is to be decremented)
	    eg ["a","b","c"] 
	delta: the amount by which the specified Global node is to be decremented (default = 1)	
	
	Returns:
	
	    results.value = the new value of the decremented node

- client.transaction(json, function(error, results) {});
	
	Invokes a sequence of actions within the back-end GT.M or Cach&#233; system.  These actions are applied in strict sequence and constitute a transaction.
	
	json = a JSON array of object literals.  Each object literal defines either a setJSON or kill command.

	For example:
	
		var action1 = {
			method:'setJSON',
			GlobalName:'mdbmTest9',
			subscripts:['a'],
			json:{this:{is:{too:'cool',really:"nice!"}}}
		};
		var action2 = {
			method:'kill',
			GlobalName:'mdbmTest9',
			subscripts:['b','c']
		};
		var json = [action1,action2];
	
	Returns ok=true if successful, ie:
	
       results.ok = true

	In the example above, the actions are invoked in the GT.M or Cach&#233; back-end in strict sequence according to their position in the *json* array, ie *action1*, followed by *action 2*.  The transaction details are sent as a single request to the back-end from Node.js and the invocation of the commands that make up the transaction occurs entirely within the back-end system.  As a result, the Node.js thread is not blocked.  The call-back function is invoked only when the entire transaction has completed at the back-end.
		
- mdbm.remoteFunction(functionName, parameters, function(error, results) {});
	
	Execute a native GTM or Cach&#233; function.  This is usually for legacy applications:
	
	functionName = function name/reference (literal), eg 'myFunc&#94;theRoutine'  
	parameters = array specifying the values for the remote function's parameters ('' if no parameters required)
	    eg ["a","b","c"] 
	
	Returns:
	
	    results.value = the response/result returned by the remote function
		
## Examples

To set the Global:  


    ^mdbmTest("check","this","out")="Too cool!"

   
and then retrieve the value again (note the asynchronous nature of Node.js will 
not guarantee the order in which the APIs below are executed in the GT.M or Cach&#233; back-end)


    var redis = require("redis-node");
    var client = redis.createClient(6330, '127.0.0.1');
    require("mwire").addCommands(client);
	
    client.setGlobal('mdbmTest', ["check","this","out"], "Too cool!",
       function(err, results) {
          if (err) throw err;
          console.log("setGlobal: " + results.ok);
    });
	
    client.getGlobal('mdbmTest', ["check","this","out"],
       function(err, results) {
          if (err) throw err;
          console.log("getGlobal: " + results.value);
          client.close();
    });

Note: this Global node could also have been created using SetJSON:

    var json = {"check":{"this":{"out":"Too cool!"}}};
    client.setJSON('mdbmTest', '', json, true,
       function(err, results) {
          if (err) throw err;
          console.log("setJSON: " + results.ok);
          client.close();
     });
 
and the original JSON could be retrieved using:

    client.getJSON('mdbmTest', '',
       function(err, json) {
          if (err) throw err;
          console.log("getJSON: " + JSON.stringify(json));
          client.close();
     });
	
## Using node-mwire with Cach&#233;

The node-mwire client can be used with a Cach&#233; database

On the client system you need to install *Node.js*, the *redis-node* client and the *node-mwire* extension as described earlier.

On the Cach&#233; back-end system, you need to do the following:

- install EWD for Cach&#233; (build 827 or later): [http://www.mgateway.com/ewd.html](http://www.mgateway.com/ewd.html)

- download the M/DB and M/Wire files from the **robtweed/mdb** repository (*http://github.com:robtweed/mdb.git*)

- you'll find a directory named */cache* in the **robtweed/mdb** repository and inside it is a file named **mdb.xml**.  Use $system.OBJ.Load(filePath) to install the M/DB and M/Wire routines that it contains into your working namespace (eg USER)
	
By default, M/Wire will run on port 6330.  On Cach&#233; systems, remote access to the M/Wire protocol is controlled by a daemon process.  To start this:

     job start^zmwireDaemon
	 
You can now access the Cach&#233; system from Node.js, eg:

    var redis = require("redis-node");
    var client = redis.createClient(6330, '192.168.1.105');
    require("mwire").addCommands(client);
	
    client.version(function (err, json) {
      if (err) throw err;
       console.log("Build = " + json.Build + "; date=" + json.Date + "; zv=" + json.Host);
      client.close(); 
    });

You should see something like:

      Build = Build 6 Beta; date=15 October 2010; zv=Cache for Windows (x86-32) 2008.2.1 (Build 902) Thu Jan 22 2009 13:50:37 EST


	

## License

Copyright (c) 2004-10 M/Gateway Developments Ltd,
Reigate, Surrey UK.
All rights reserved.

http://www.mgateway.com
Email: rtweed@mgateway.com

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

