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
  self._app.log.info("Sonos ("+self._config.IP+") => "+ data);
  //Here I should do something with the data.
  return true;
}

NinjaSonosDriver.prototype.FetchState = function(){
  var self = this;
  self._app.log.info("Sonos ("+self._config.IP+") => Fetch state");
  self._client.getCurrentState(self.StateResult.bind(this));
};

NinjaSonosDriver.prototype.StateResult = function(err,state){
  var self = this;
  if(state) {
    self._app.log.info("Sonos ("+self._config.IP+") Current state => "+ state);
    this.emit('data',state);
  }

};

NinjaSonosDriver.prototype.end = function(){};
NinjaSonosDriver.prototype.stop = function(){};
