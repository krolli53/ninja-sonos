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

  this.emitState = function(){
    this._client.getCurrentState(self.StateResult.bind(this));
  }.bind(this);

  clearInterval(this.stateIV);
  this.stateIV = setInterval(this.emitState.bind(this),POLL_INTERVAL*1000);

  this.emitState();
}

NinjaSonosDriver.prototype.write = function(data){
  var self = this;
  self._app.log.info("Sonos ("+self.config.IP+") => " data);

  return true;
}

NinjaSonosDriver.prototype.StateResult = function(err,state){
  var self = this;
  if(state) {
    self._app.log.info("Sonos ("+self.config.IP+") Current state => "+ state);
    this.emit('data',state);
  }

};

NinjaSonosDriver.prototype.end = function(){};
NinjaSonosDriver.prototype.stop = function(){};
