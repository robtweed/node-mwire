/*
 
 M/Wire extension to Brian Noguchi's redis-node client (http://github.com/bnoguchi/redis-node)

 This adds the additional commands used by M/Wire to allow manipulation
 of Globals in GT.M and Cache

 See http://www.mgateway.com/docs/universalNoSQL.pdf

 M/Wire applies the Redis wire protocol to provide high-speed access to Cache and GT.M Globals.

 redis-node provides very high-speed access over M/Wire.

 For more details on M/Wire, see http://www.mgateway.com/mwire.html

20 June 2011: Rob Tweed, M/Gateway Developments Ltd

------------------------------------------------------
Copyright (c) 2004-11 M/Gateway Developments Ltd,
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

Build 0.0.11 - 20 June 2011

*/

var build = '0.0.11 (20 June 2011)';

var redis = require("redis-node");
var events = require("events");
var fs = require("fs");

var mwireClient = function(params) {
    this.init(params);
};

mwireClient.prototype.init = function(params) {
    params = params || {};

    // check required params
    this.poolSize = params.poolSize || 5;
    this.port = params.port || 6330;
    this.host = params.host || '127.0.0.1';

    this.clientPool = [];
    var no;
    for (no=0;no<this.poolSize;no++) {
      this.clientPool[no] = redis.createClient(this.port, this.host);
      this.addCommands(this.clientPool[no]);
    }
    this.event = new events.EventEmitter();
    var mwire = this;
    this.event.on("getNext",
       function(globalName, subscripts, callback) {
          mwire.clientPool[mwire.connection()].getNextSubscript(globalName, subscripts, callback);
       }  
    );
    this.event.on("nextNode",
       function(globalReference, callback) {
          mwire.clientPool[mwire.connection()].getNextNode(globalReference, callback);
       }  
    );
};

mwireClient.prototype.onNext = function(globalName, subscripts, callback) {
   this.event.emit("getNext", globalName, subscripts, callback);
};

mwireClient.prototype.onNextNode = function(globalReference, callback) {
   this.event.emit("nextNode", globalReference, callback);
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
                     "ping",
                     "copyGlobal"
     ] ;
     commands.forEach( function (commandName) {
        redisClient[commandName] = function () {
           var len = arguments.length,args = new Array(1 + len);
           args[0] = commandName;
           for (var i = 0, len = arguments.length; i < len; i++) {
              if (commandName === 'getsubscripts') {
                if (arguments[i] === '') arguments[i] = 'zz-null';
              }
              args[i+1] = arguments[i];
           }
           //console.log(commandName + ": " + JSON.stringify(args));
           this.sendCommand(args);
        };
     });

     redisClient.inUse = false;

     redisClient.remoteFunction = function(functionName, parameters, callback) {
         if (parameters !== '') parameters = JSON.stringify(parameters);
         redisClient.execute(functionName, parameters, function (err, value) {
           if (value === null) value = '';
           if ((value.substr(0,1) === '{')||(value.substr(0,1) === '[')) {
              callback(err,JSON.parse(value));
           }
           else {
              callback(err,{value:value});
           }
         });
     };

     redisClient.increment = function(globalName, subscripts, delta, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.incrby(gloRef, delta, function (err, value) {
           redisClient.inUse = false;
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
     
     redisClient.getNextNode = function(globalReference, callback) {
         redisClient.inUse = true;
         redisClient.queryget(globalReference, function (err, results) {
           if (results === null) results = ['',''];
           if (results[1] === null) results[1] = '';
           redisClient.inUse = false;
           callback(err,{globalReference: results[0], data: results[1]});
         });
     };
     
     redisClient.getSubscripts = function(globalName, subscripts, from, to, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getsubscripts(gloRef, from, to, function (err, arrayString) {
           redisClient.inUse = false;
           callback(err,JSON.parse(arrayString));
         });
     };

     redisClient.getAllSubscripts = function(globalName, subscripts, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         redisClient.getsubscripts(gloRef, '', '', function (err, arrayString) {
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
           if (!jsonString) jsonString = '{}';
           if (jsonString === '[""]') jsonString = '{}';
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
         jsonString = escape(jsonString);
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
              Host: infoArray[2],
              node_mwire: build
           };
           redisClient.inUse = false;
           callback(err,json);
         });

     };

     redisClient.setGlobal = function(globalName, subscripts, value, callback) {
         redisClient.inUse = true;
         if (subscripts === '') subscripts = [];
         var gloRef = globalName + JSON.stringify(subscripts);
         if (value === '') value = 'zmwire_null_value';
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

     redisClient.cloneGlobal = function(fromGlobalName, fromSubscripts, toGlobalName, toSubscripts, toClearDown, callback) {
         redisClient.inUse = true;
         if (fromSubscripts === '') fromSubscripts = [];
         if (toSubscripts === '') toSubscripts = [];
         var fromGloRef = fromGlobalName + JSON.stringify(fromSubscripts);
         var toGloRef = toGlobalName + JSON.stringify(toSubscripts);
         var kill = 0;
         if (toClearDown) kill = 1;
         redisClient.copyGlobal(fromGloRef, toGloRef, kill, function (err, results) {
           redisClient.inUse = false;
           callback(err,results);
         });
     };

};

mwireClient.prototype.backupGlobal = function(globalName, subscripts, filePath, callback) {
  var mwire = this;
  var gloRefSeed;
  if (subscripts === '') {
    gloRefSeed = globalName + '[""]';
  }
  else {
    gloRefSeed = globalName + JSON.stringify(subscripts);
  }
  var data = '';
  var writeStream = fs.createWriteStream(filePath); 
  var query = function(error, results) {
    var gloRef = results.globalReference;
    if (gloRef !== '') {
      data = data + gloRef + '\r\n' + results.data + '\r\n';
      if (data.length > 100000) {
        writeStream.write(data);
        data = '';
      }
      mwire.onNextNode(gloRef, query);
    }
    else {
      writeStream.write(data);
      writeStream.end();
      callback(error,{ok:true});
    }
  };
  mwire.onNextNode(gloRefSeed, query);
};


mwireClient.prototype.setHttpLogDays = function(noOfDays) {
   var mwire = this;
   if (noOfDays === undefined) noOfDays = 5;
   if (noOfDays === '') noOfDays = 5;
   this.clientPool[this.connection()].setGlobal("nodeHTTPLog", ["noOfDaysToKeep"], noOfDays, 
      function(error,results) {
         var expiryTime = new Date().getTime() - (noOfDays * 86400000);
         mwire.HTTPLogExpiry = expiryTime;
      }
   );
};

mwireClient.prototype.httpLog = function(request) {
   var mwire = this;
   var urlObj = require("url").parse(request.url); 

   var logHTTPEvent = function(error,results) {
      var date = new Date();
      var event = {
         timeStamp: date.getTime(),
         time: date.toUTCString(),
         headers: request.headers,
         url: request.url,
         method: request.method,
         httpVerion: request.httpVersion,
         remoteAddr: request.connection.remoteAddress
      };
      mwire.clientPool[mwire.connection()].setJSON("nodeHTTPLog", ["log", results.value], event, false, function(e,r){});
   };

   this.clientPool[this.connection()].increment("nodeHTTPLog", ["nextEventNo"], 1, logHTTPEvent);

   var deleteLogIfExpired = function(error, results) {
     var eventNo = results.subscriptValue;
     if (eventNo !== '') {
         mwire.clientPool[mwire.connection()].getGlobal("nodeHTTPLog", ["log", eventNo, "timeStamp"], 
            function(error,results) {
               //console.log("checking HTTP Log event " + eventNo + ": timeStamp = " + results.value + "; expiry = " + mwire.HTTPLogExpiry);
               if ( results.value < mwire.HTTPLogExpiry ) {
                  //console.log("HTTP Log entry " + eventNo + " has been deleted");
                  mwire.clientPool[mwire.connection()].kill("nodeHTTPLog", ["log", eventNo], function(error,results){});
                  mwire.onNext("nodeHTTPLog", ["log", eventNo], deleteLogIfExpired);
               }
            }
         );
     }
   };

   if (!this.HTTPExpiryDaemonRunning) {
      var mwire = this;
      setInterval(
         function() {
            mwire.clientPool[mwire.connection()].getGlobal("nodeHTTPLog", ["noOfDaysToKeep"], 
               function(error,results) {
                  var noOfDays = results.value;
                  if (noOfDays === '') noOfDays = 7;
                  var expiryTime = new Date().getTime() - (noOfDays * 86400000);
                  mwire.HTTPLogExpiry = expiryTime;
                  mwire.onNext("nodeHTTPLog", ["log", ""], deleteLogIfExpired)
               }
            );
         },
      3600000);
      this.HTTPExpiryDaemonRunning = true;
   }

};

exports.Client = mwireClient;
