/*
 
 M/Wire extension to Brian Noguchi's redis-node client (http://github.com/bnoguchi/redis-node)

 This adds the additional commands used by M/Wire to allow manipulation
 of Globals in GT.M and Cache

 See http://www.mgateway.com/docs/universalNoSQL.pdf

 M/Wire applies the Redis wire protocol to provide high-speed access to Cache and GT.M Globals.

 redis-node provides very high-speed access over M/Wire.

 For more details on M/Wire, see http://www.mgateway.com/mwire.html

15 October 2010: Rob Tweed, M/Gateway Developments Ltd

------------------------------------------------------
Copyright (c) 2004-10 M/Gateway Developments Ltd,
Reigate, Surrey UK.
All rights reserved.

http://www.mgateway.com
Email: rtweed@mgateway.com

This program is free software: you can redistribute it
and/or modify it under the terms of the 
GNU Affero General Public License as published by the 
Free Software Foundation, either version 3 of the License, 
or (at your option) any later version.

This program is distributed in the hope that it will be 
useful, but WITHOUT ANY WARRANTY; without even the 
implied warranty of MERCHANTABILITY or FITNESS FOR A 
PARTICULAR PURPOSE.  See the GNU Affero General Public 
License for more details.

You should have received a copy of the GNU Affero 
General Public License along with this program.  
If not, see <http://www.gnu.org/licenses/>.
----------------------------------------------------------

Build 0.0.5 - 07 November 2010

*/

var redis = require("redis-node");

var mwireClient = function(params) {
    this.init(params);
};

mwireClient.prototype.init = function(params) {
    params = params || {};

    // check requried params

    this.poolSize = params.poolSize || 5;

    this.clientPool = [];
    var no;
    for (no=0;no<this.poolSize;no++) {
      this.clientPool[no] = redis.createClient(params.port, params.host);
      this.addCommands(this.clientPool[no]);
    }
};

mwireClient.prototype.connection = function() {
  // randomly select a connection from available pool
  return Math.floor(Math.random()*this.poolSize);
};

mwireClient.prototype.guid = function() {
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
    function(c) {
       var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
       return v.toString(16);
    }
 ).toUpperCase();
};


mwireClient.prototype.addCommands = function(redisClient) {

     var commands = ["data",
                     "lock", 
                     "unlock", 
                     "nextsubscript", 
                     "previoussubscript", 
                     "orderall", 
                     "execute", 
                     "getglobal",
                     "getglobals",
                     "getglobals2",
                     "getjsonstring",
                     "setjsonstring",
                     "getsubscripts",
                     "multiget", 
                     "revorder", 
                     "previous",
                     "query",
                     "queryget",
                     "tstart",
                     "tcommit",
                     "trollback",
                     "processid",
                     "mdate",
                     "getbuild",
                     "runtransaction",
                     "ping"
     ] ;
     commands.forEach( function (commandName) {
        redisClient[commandName] = function () {
           var len = arguments.length,args = new Array(1 + len);
           args[0] = commandName;
           for (var i = 0, len = arguments.length; i < len; i++) {
              args[i+1] = arguments[i];
           }
           this.sendCommand(args);
        };
     });

     redisClient.inUse = false;

     redisClient.remoteFunction = function(functionName, parameters, callback) {
         if (parameters !== '') parameters = JSON.stringify(parameters);
         redisClient.execute(functionName, parameters, function (err, value) {
           callback(err,{value:value});
         });
     };

     redisClient.increment = function(globalName, subscripts, delta, callback) {
         redisClient.inUse = true;
         //console.log("redisClient.increment started at " + new Date().getTime());
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.incrby(gloRef, delta, function (err, value) {
           redisClient.inUse = false;
           //console.log("redisClient.increment finished at " + new Date().getTime());
           callback(err,{value:value});
         });
     };

     redisClient.decrement = function(globalName, subscripts, delta, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.decrby(gloRef, delta, function (err, value) {
           redisClient.inUse = false;
           callback(err,{value:value});
         });
     };

     redisClient.getNextSubscript = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.nextsubscript(gloRef, function (err, jsonString) {
           redisClient.inUse = false;
           callback(err,JSON.parse(jsonString));
         });
     };

     redisClient.getPreviousSubscript = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.previoussubscript(gloRef, function (err, jsonString) {
           redisClient.inUse = false;
           callback(err,JSON.parse(jsonString));
         });
     };

     redisClient.getAllSubscripts = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getsubscripts(gloRef, function (err, arrayString) {
           redisClient.inUse = false;
           callback(err,JSON.parse(arrayString));
         });
     };

     redisClient.getGlobalList = function(callback) {
         redisClient.inUse = true;
         redisClient.getglobals(function (err, arrayString) {
           redisClient.inUse = false;
           callback(err,JSON.parse(arrayString));
         });
     };

     redisClient.getGlobalsTest = function(callback) {
         redisClient.getglobals2(function (err, array) {
           callback(err,array);
         });
     };

     redisClient.getJSON = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getjsonstring(gloRef, function (err, jsonString) {
           redisClient.inUse = false;
           // workaround for intermittent error!
           if (jsonString.substr(-1) !== '}') jsonString = jsonString + '}'
           callback(err,JSON.parse(jsonString));
         });
     };

     redisClient.kill = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.del(gloRef, function (err, ok) {
           redisClient.inUse = false;
           callback(err,{ok:ok});
         });
     };

     redisClient.setJSON = function(globalName, subscripts, json, deleteBeforeSave, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         var jsonString = JSON.stringify(json);
         var del = 0;
         if (deleteBeforeSave) del = 1;
         redisClient.setjsonstring(gloRef, jsonString, del, function (err, ok) {
           redisClient.inUse = false;
           var status = ok === 'ok';
           callback(err,{ok:status});
         });
     };

     redisClient.transaction = function(json, callback) {
         redisClient.inUse = true;
         var jsonString = JSON.stringify(json);
         redisClient.runtransaction(jsonString, function (err, ok) {
           redisClient.inUse = false;
           var status = ok === 'ok';
           callback(err,{ok:status});
         });
     };

     redisClient.version = function(callback) {
         redisClient.inUse = true;
         redisClient.getbuild(function (err, infoArray) {
           var json = {
              Build: infoArray[0],
              Date: infoArray[1],
              Host: infoArray[2]
           };
           redisClient.inUse = false;
           callback(err,json);
         });

     };

     redisClient.setGlobal = function(globalName, subscripts, value, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.set(gloRef, value, function (err, stat) {
            redisClient.inUse = false;
            callback(err,JSON.parse(stat));
         });
     };

     redisClient.getGlobal = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getglobal(gloRef, function (err, jsonString) {
           redisClient.inUse = false;
           // workaround for intermittent error!
           if (jsonString.substr(-1) !== '}') jsonString = jsonString + '}'
           callback(err,JSON.parse(jsonString));
         });
     };

     redisClient.multiGetGlobal = function(json, callback) {
         redisClient.inUse = true;
         var jsonString = JSON.stringify(json);
         redisClient.multiget(jsonString, function (err, jsonResponse) {
           redisClient.inUse = false;
           callback(err,JSON.parse(jsonResponse));
         });
     };

};

exports.Client = mwireClient;
