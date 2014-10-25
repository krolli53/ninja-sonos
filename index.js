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
  , sonos = require('sonos');

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

  this.devices = [];
  this.sonosSearcher;

  //This is fired when the client connects
  app.on('client::up',function(){
      self.writeLog("Ninja Sonos => Client Up");
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
  this.writeLog("Ninja Sonos => Searching players");
  self.sonosSearcher = sonos.search();

  self.sonosSearcher.on('DeviceAvailable',function(ip,model){
    self.writeLog('Found ' + model +': '+ip);
    //Check if it is a player.
    if(model.substr(0,3) == "ZPS"){
      self.registerPlayer(ip);
    }

    //Here I should register the device.
  });
};

ninjaSonos.prototype.loadPlayers = function(){
  var self = this;
  this.writeLog("Ninja Sonos => Loading players");
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
  this.writeLog("Ninja Sonos => Setting up player "+ip);

  //Create a Node.js sonos device.
  var sonosPlayer = new sonos.Sonos(ip);

  //Load the information
  sonosPlayer.getZoneInfo(function(err,info){
    self.writeLog(err,info);
  });
};

ninjaSonos.prototype.writeLog = function(text){
  if(this._opts.logging == 2)
    this._app.log.info(text,arguments);
};

ninjaSonos.prototype.writeError =function(text){
  if(this._opts.logging == 2 || this._opts.logging == 1)
    this._app.log.error(text,arguments);
};
