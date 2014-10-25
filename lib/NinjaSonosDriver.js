var stream = require('stream');
var util = require('util');

util.inherits(NinjaSonosDriver,stream);
module.exports = NinjaSonosDriver;

var POLL_INTERVAL = 10;

function guidSafe(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '');
}

function NinjaSonosDriver(client,config,app){
  this.readable = true;
  this.writeable = true
  this.V = 0;
  this.D = 244; //Generic state driver
  this.name = "Sonos - " + config.CurrentZoneName;
  this.G = guidSafe("sonos"+config.IP);

  this._app = app;
  this._config = config;
  this._client = client;

  var self = this;

  self._app.log.info("Sonos",config,client);

  this.staticFetchState = self.FetchState.bind(this);



  clearInterval(this.stateIV);
  this.stateIV = setInterval(this.staticFetchState,POLL_INTERVAL*1000);

  this.staticFetchState();
}

NinjaSonosDriver.prototype.write = function(data){
  var self = this;
  self.writeLog("Received new state",data);
  //Here I should do something with the data.
  switch(data){
      case "playing":
        self._client.play(function(err,playing){
          if(err)
            this.writeError(err);
          else
            self.writeLog("Started playing");
        }.bind(self));
        break;
      case "stopped":
        self._client.pause(function(err,paused){
          if(err)
            this.writeError(err);
          else
            self.writeLog("Paused playing"); 
        }.bind(self));
        break;
  }

  return true;
}

NinjaSonosDriver.prototype.FetchState = function(){
  var self = this;
  self.writeLog("COMMAND","Fetch state");
  self._client.getCurrentState(self.StateResult.bind(this));
};

NinjaSonosDriver.prototype.StateResult = function(err,state){
  var self = this;
  if(state) {
    self.writeLog("Fetched state",state);
    self.emit('data',state);
  } else if(err){
    self.writeError(err);
  }

};

NinjaSonosDriver.prototype.writeLog = function(){
  var self = this;
  if(self._config.logging == 2) {
    self._app.log.info("Sonos ("+self._config.IP+")",arguments);
  }
};

NinjaSonosDriver.prototype.writeError = function(){
  var self = this;
  if(self._config.logging == 2 || self._config.logging == 1) {
    self._app.log.error("Sonos ("+self._config.IP+")",arguments);
  }

};

NinjaSonosDriver.prototype.end = function(){};
NinjaSonosDriver.prototype.stop = function(){};
