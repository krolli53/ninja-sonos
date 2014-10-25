/* =================================
 * == Ninja Sonos                 ==
 * == By Stephan van Rooij        ==
 * == With help from Ben Evans    ==
 * ==                             ==
 * == Driver inspired on ninjahue ==
 * =================================
 */
var util = require('util')
  , stream = require('stream')
  , sonos = require('sonos')
  , sleep = require('sleep')
  , NinjaSonosDriver = require('./lib/NinjaSonosDriver');

util.inherits (ninjaSonos,stream);
module.exports = ninjaSonos;

function ninjaSonos(opts,app){
  var self = this;

  this._app = app;
  this._opts = opts;
  this._opts.sonosPlayers = opts.sonosPlayers || [];

  //logging 2 = everything (default), logging 1 = only errors
  this._opts.logging = opts.logging == undefined ? 2 : opts.logging;
  this.appName = 'NinjaBlocks-'+ app.id;

  this.sonosClient = [];
  this.subDevices = [];
  this.sonosSearcher;

  this.loadingIp;

  this.staticLoadedAttributes = self.loadedAttributes.bind(self);

  //This is fired when the client connects
  app.on('client::up',function(){
      self.writeLog("Client Up");
      //If we have players, add them.
      if(self._opts.sonosPlayers.length > 0){
        self.loadPlayers.call(self);
      } else { //No players, so search for them.
        //first create a default config
        self.save();
        self.findPlayers.call(self);
      }
  });
};

ninjaSonos.prototype.findPlayers = function(){
  var self = this;
  this.writeLog("Searching players");

  //Bind static function
  self.staticFoundPlayer = self.foundPlayer.bind(this);

  self.sonosSearcher = sonos.search();
  self.sonosSearcher.on('DeviceAvailable',self.staticFoundPlayer);
};

ninjaSonos.prototype.foundPlayer = function(ip,model){
  var self = this;
  self.writeLog('Found ' + model +': '+ip);
  //Check if it is a player.
  if(model.substr(0,3) == "ZPS"){
    self.registerPlayer(ip);
  }
}

ninjaSonos.prototype.loadPlayers = function(){
  var self = this;
  this.writeLog("Loading players");
  self._opts.sonosPlayers.forEach(self.setupPlayer.bind(this));
};

ninjaSonos.prototype.registerPlayer = function(ip){
  var self = this;
  var index = self._opts.sonosPlayers.indexOf(ip);
  if(index > -1) //Already in de list
    return;

  self._opts.sonosPlayers.push(ip);
  self.save();

  self.setupPlayer(ip);

};

ninjaSonos.prototype.setupPlayer = function(ip){
  var self = this;
  //Check if we are loading attributes
  if(self.loadingIP == undefined || self.loadingIP == "") {
    
    this.writeLog("Setting up player "+ip);

    //Saving the current IP
    self.loadingIP = ip;

    //Create a Node.js sonos device.
    var sonosPlayer = new sonos.Sonos(ip);

    //Load the information
    sonosPlayer.getZoneAttrs(self.staticLoadedAttributes);
    this.sonosClient[ip] = sonosPlayer;

  } else { //We are already loading a device, so we set a timeout to retry.
    setTimeout(function(){
      self.setupPlayer(ip);
    }.bind(this),1500);
  }

};

ninjaSonos.prototype.loadedAttributes = function(err,attr){
  var self = this;
  var ip = self.loadingIP;

  if(attr){
    self.writeLog("Loaded attributes for ("+self.loadingIP+")",attr);

    //Create the sonos config
    var config = {IP:ip,CurrentZoneName: attr.CurrentZoneName,logging:self._opts.logging};
    var client = self.sonosClient[ip];

    self.emit('register',new NinjaSonosDriver(client,config,self._app));
  }

  //Resetting the value so we can try the next IP.
  self.loadingIP = "";

};

ninjaSonos.prototype.writeLog = function(){
  if(this._opts.logging == 2)
    this._app.log.info("Ninja Sonos",arguments);
};

ninjaSonos.prototype.writeError =function(){
  if(this._opts.logging == 2 || this._opts.logging == 1)
    this._app.log.error("Ninja Sonos",arguments);
};
