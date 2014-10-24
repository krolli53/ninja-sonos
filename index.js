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
  , Sonos = require('sonos');

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

  //This is fired when the client connects
  app.on('client::up',function(){
      self.writeLog("Ninja Sonos => Client Up");
      //If we have players, add them.
      if(self._opts.sonosPlayers.length > 0){
        self.loadPlayers.call(self);
      } else { //No players, so search for them.
        self.findPlayers.call(self);
      }
  });
};

ninjaSonos.prototype.findPlayers = function(){
  var self = this;
  this.writeLog("Ninja Sonos => Searching players");
  var search = Sonos.search();

  search.on('DeviceAvailable',function(device,model){
    self.writeLog('Found ' + model +': '+device);

    //Here I should register the device.
  });
};

ninjaSonos.prototype.loadPlayers = function(){
  var self = this;
  this.writeLog("Ninja Sonos => Loading players");
  self._opts.sonosPlayers.forEach(self.registerPlayer.bind(this));
};

ninjaSonos.prototype.registerPlayer = function(ip){
  var self = this;
  this.writeLog("Ninja Sonos => Setting up player "+ip);
};

ninjaSonos.prototype.writeLog = function(){
  if(this._opts.logging == 2)
    this._app.log.info(arguments);
};

ninjaSonos.prototype.writeError =function(text){
  if(this._opts.logging == 2 || this._opts.logging == 1)
    this._app.log.error(arguments);
};
