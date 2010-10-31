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

Build 0.0.2 - 31 October 2010

*/

var addCommands = function(redisClient) {
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

     redisClient.remoteFunction = function(functionName, parameters, callback) {
         if (parameters !== '') parameters = JSON.stringify(parameters);
         redisClient.execute(functionName, parameters, function (err, value) {
           var json = {value:value};
           callback(err,json);
         });
     };

     redisClient.increment = function(globalName, subscripts, delta, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.incrby(gloRef, delta, function (err, value) {
           var json = {value:value};
           callback(err,json);
         });
     };

     redisClient.decrement = function(globalName, subscripts, delta, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.decrby(gloRef, delta, function (err, value) {
           var json = {value:value};
           callback(err,json);
         });
     };

     redisClient.getNextSubscript = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.nextsubscript(gloRef, function (err, jsonString) {
           var json = JSON.parse(jsonString);
           callback(err,json);
         });
     };

     redisClient.getPreviousSubscript = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.previoussubscript(gloRef, function (err, jsonString) {
           var json = JSON.parse(jsonString);
           callback(err,json);
         });
     };

     redisClient.getAllSubscripts = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getsubscripts(gloRef, function (err, arrayString) {
           var array = JSON.parse(arrayString);
           callback(err,array);
         });
     };

     redisClient.getGlobalList = function(callback) {
         redisClient.getglobals(function (err, arrayString) {
           var array = JSON.parse(arrayString);
           callback(err,array);
         });
     };

     redisClient.getGlobalsTest = function(callback) {
         redisClient.getglobals2(function (err, array) {
           callback(err,array);
         });
     };

     redisClient.getJSON = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getjsonstring(gloRef, function (err, jsonString) {
           var json = JSON.parse(jsonString);
           callback(err,json);
         });
     };

     redisClient.kill = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.del(gloRef, function (err, ok) {
           var response = {ok:ok};
           callback(err,response);
         });
     };

     redisClient.setJSON = function(globalName, subscripts, json, deleteBeforeSave, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         var jsonString = JSON.stringify(json);
         var del = 0;
         if (deleteBeforeSave) del = 1;
         redisClient.setjsonstring(gloRef, jsonString, del, function (err, ok) {
           var status=false;
           if (ok === 'ok') status=true;
           var response = {ok:status};
           callback(err,response);
         });
     };

     redisClient.transaction = function(json, callback) {
         var jsonString = JSON.stringify(json);
         redisClient.runtransaction(jsonString, function (err, ok) {
           var status=false;
           if (ok === 'ok') status=true;
           var response = {ok:status};
           callback(err,response);
         });
     };

     redisClient.version = function(callback) {
         redisClient.getbuild(function (err, infoArray) {
           var json = {
              Build: infoArray[0],
              Date: infoArray[1],
              Host: infoArray[2]
           };
           callback(err,json);
         });

     };

     redisClient.setGlobal = function(globalName, subscripts, value, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.set(gloRef, value, function (err, stat) {
            callback(err,{ok:stat});
         });
     };

     redisClient.getGlobal = function(globalName, subscripts, callback) {
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getglobal(gloRef, function (err, jsonString) {
           var json = JSON.parse(jsonString);
           callback(err,json);
         });
     };

     redisClient.multiGetGlobal = function(json, callback) {
         var jsonString = JSON.stringify(json);
         redisClient.multiget(jsonString, function (err, jsonResponse) {
           var jsonOut = JSON.parse(jsonResponse);
           callback(err,jsonOut);
         });
     };

};

exports.addCommands = addCommands;
