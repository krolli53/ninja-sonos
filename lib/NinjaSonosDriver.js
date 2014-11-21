var stream = require('stream');
var util = require('util');

util.inherits(NinjaSonosDriver,stream);
module.exports = NinjaSonosDriver;

var POLL_INTERVAL = 10;
var DOORBELL_MP3_URL = "http://i872953.iris.fhict.nl/sounds/two_tone_doorbell.mp3";
var DOGS_MP3_URL = "http://i872953.iris.fhict.nl/sounds/barking_dogs.mp3";

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
    case "volume":
        self._client.setVolume("20",function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started playing");
            self.emit('data','playing');
          }
        }.bind(self));
        break;
    
      case "playing":
        self._client.play(function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started playing");
            self.emit('data','playing');
          }
        }.bind(self));
        break;
      case "stopped":
        self._client.pause(function(err,paused){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Paused playing");
            self.emit('data','stopped');
          }
        }.bind(self));
        break;
      case "doorbell":
        self._client.play(self._config.urls.doorbell,function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started gong");
            //self.emit('data','playing');
          }
        }.bind(self));
        break;
      case "dogs":
        self._client.play(self._config.urls.dogs,function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started dogs");
            //self.emit('data','playing');
          }
        }.bind(self));
        break;
      case "radio1":
        self._client.play(self._config.urls.radio1,function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started radio1");
            //self.emit('data','playing');
          }
        }.bind(self));
        break;
      case "radio2":
        self._client.play(self._config.urls.radio2,function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started radio2");
            //self.emit('data','playing');
          }
        }.bind(self));
        break;
      case "radio3":
        self._client.play(self._config.urls.radio3,function(err,playing){
          if(err)
            this.writeError(err);
          else {
            self.writeLog("Started radio3");
            //self.emit('data','playing');
          }
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

NinjaSonosDriver.prototype.UpdateConfig = function(newConf){
  var self = this;
  self._config.logging = newConf.logging;
  self._config.urls = newConf.urls;
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
