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

/* Default urls, can be overriden with the settings. */
var DOORBELL_MP3_URL = "http://i872953.iris.fhict.nl/sounds/two_tone_doorbell.mp3";
var DOGS_MP3_URL = "http://i872953.iris.fhict.nl/sounds/barking_dogs.mp3";
var RADIO1_MP3_URL = "x-rincon-mp3radio://vip-icecast.538.lw.triple-it.nl/SLAMFM_MP3";
var RADIO2_MP3_URL = "x-rincon-mp3radio://vip-icecast.538.lw.triple-it.nl/WEB17_MP3";
var RADIO3_MP3_URL = "x-rincon-mp3radio://icecast-qmusic.cdp.triple-it.nl/Qmusic_nl_nonstop_96.mp3";

function ninjaSonos(opts,app){
  var self = this;

  this._app = app;
  this._opts = opts;
  this._opts.sonosPlayers = opts.sonosPlayers || [];

  //logging 2 = everything (default), logging 1 = only errors
  this._opts.logging = opts.logging == undefined ? 2 : opts.logging;
  this.appName = 'NinjaBlocks-'+ app.id;



  //URLS
  this._opts.urls = opts.urls || {};
  this._opts.urls.radio1 = this._opts.urls.radio1 || RADIO1_MP3_URL;
  this._opts.urls.radio2 = this._opts.urls.radio2 || RADIO2_MP3_URL;
  this._opts.urls.radio3 = this._opts.urls.radio3 || RADIO3_MP3_URL;
  this._opts.urls.doorbell = this._opts.urls.doorbell || DOORBELL_MP3_URL;
  this._opts.urls.dogs = this._opts.urls.dogs || DOGS_MP3_URL;

  this.sonosClient = [];
  this.subDevices = [];
  this.sonosSearcher;

  this.loadingIp;

  //create a static function that is always called with the current instance.
  this.staticLoadedAttributes = self.loadedAttributes.bind(self);
  this.staticFoundPlayer = self.foundPlayer.bind(self);

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

  self.sonosSearcher = sonos.search();
  //self.sonosSearcher.on('DeviceAvailable',self.staticFoundPlayer);
  self.sonosSearcher.on('DeviceAvailable',function(device,model){
    var self2 = this;
    self2.writeLog(device,model);
    self2.staticFoundPlayer(device,model);
  });
};

ninjaSonos.prototype.foundPlayer = function(ip,model){
  var self = this;
  self.writeLog('Found ' + model +': '+ip);
  //Check if it is a player.
  if(model.substr(0,3) == "ZPS"){
    self.registerPlayer(ip);
  }
}

/* Config Section */
ninjaSonos.prototype.config = function(rpc,cb){
  console.log('RPC CONFIG',rpc);

  var self = this;

  if(!rpc){ //No command, show main screen.
    return cb(null,{"contents":[
      { "type": "paragraph", "text": "Welcome to the Ninja sonos driver!"},
      { "type": "submit", "name": "General Settings", "rpc_method": "mainSettings" },
      { "type": "paragraph", "text": "Make sure your sonos devices have a static ip before adding them!"},
			{ "type": "submit", "name": "Add Sonos speaker", "rpc_method": "addSonos" },
      { "type":"close", "text":"Close"}
    ]});
  } //Show other screen....

  self.writeLog('Settings', rpc.method, rpc);

  switch(rpc.method){
    case 'addSonos':
      return cb(null,{
        "contents":[
          { "type": "paragraph", "text":"Please enter the IP address of the new sonos speaker"},
          { "type": "input_field_text", "field_name": "ip", "value": "", "label": "IP-address", "placeholder": "x.x.x.x", "required": true},
          { "type": "paragraph", "text":"The device name will be fetched automaticly"},
          {"type": "submit", "name": "Add", "rpc_method": "add" },
          { "type":"close", "text":"Cancel"}
        ]
      });
      break;
    case 'add':
      var ip = rpc.params.ip;
      self.writeLog("Adding player from dashboard",ip);
      if(ip) {
        self.registerPlayer(ip);
        return cb(null,{
          "contents":[
            { "type": "paragraph", "text":"Sonos player added to your dashboard!"},
            { "type": "paragraph", "text":"Remember you have to create the states yourself. 'playing','stopped','dogs','doorbell'"},
            { "type":"close", "text":"Close"}
          ]
        });
      }
      break;
    case 'mainSettings':
      return cb(null,{
        "contents":[
          { "type": "paragraph", "text": "Sonos driver main settings"},
          { "type": "paragraph", "text": "Logging level (2 = everything, 1 = only errors, 0 = nothing)"},
          { "type": "input_field_text", "field_name": "loggingLevel", "value": self._opts.logging, "label": "Logging", "placeholder": "2", "required": true},
          { "type": "paragraph", "text": "You can set the urls for the extra states here, these will be called from your dashboard"},
          { "type": "paragraph", "text": "Be carefull streaming urls should start with 'x-rincon-mp3radio://' instead of http:// !!!"},
          { "type": "input_field_text", "field_name":"url_dogs","value":self._opts.urls.dogs,"label":"dogs","placeholder":DOGS_MP3_URL},
          { "type": "input_field_text", "field_name":"url_doorbell","value":self._opts.urls.doorbell,"label":"doorbell","placeholder":DOORBELL_MP3_URL},
          { "type": "input_field_text", "field_name":"url_radio1","value":self._opts.urls.radio1,"label":"radio1","placeholder":RADIO1_MP3_URL},
          { "type": "input_field_text", "field_name":"url_radio2","value":self._opts.urls.radio2,"label":"radio2","placeholder":RADIO2_MP3_URL},
          { "type": "input_field_text", "field_name":"url_radio3","value":self._opts.urls.radio3,"label":"radio3","placeholder":RADIO3_MP3_URL},
          {"type": "submit", "name": "Save settings", "rpc_method": "saveSettings" },
          { "type":"close", "text":"Cancel"}
        ]
      });
      break;
    case 'saveSettings':
      self._opts.logging = rpc.params.loggingLevel;
      self._opts.urls.dogs = rpc.params.url_dogs;
      self._opts.urls.doorbell = rpc.params.url_doorbell;
      self._opts.urls.radio1 = rpc.params.url_radio1 || RADIO1_MP3_URL;
      self._opts.urls.radio2 = rpc.params.url_radio2 || RADIO2_MP3_URL;
      self._opts.urls.radio3 = rpc.params.url_radio3 || RADIO3_MP3_URL;;
      self.save();
      var newConfig = {"logging":self._opts.logging,"urls":self._opts.urls};
      self.updatePlayerConfig(newConfig);
      return cb(null,{
        "contents":[
          { "type": "paragraph", "text":"Settings saved"},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    default:
      self.writeError("Unknown RPC method",rpc.method,rpc);
  }


};
/* End Config section */

ninjaSonos.prototype.registerPlayer = function(ip){
  var self = this;
  var index = self._opts.sonosPlayers.indexOf(ip);
  if(index > -1) //Already in de list
    return;

  self._opts.sonosPlayers.push(ip);
  self.save();

  self.setupPlayer(ip);

};


//This function is for setting up the players from the config.
ninjaSonos.prototype.loadPlayers = function(){
  var self = this;
  this.writeLog("Loading players");
  self._opts.sonosPlayers.forEach(self.setupPlayer.bind(this));
};

//This function is for setting up one player.
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

ninjaSonos.prototype.updatePlayerConfig = function(newConf){
  var self = this;
  if(self.sonosClient.length >0){
    for(var ip in self.sonosClient){
      self.sonosClient[ip].UpdateConfig(newConf);
    }
  }
};

//This is used when we got a response back with player attributes.
ninjaSonos.prototype.loadedAttributes = function(err,attr){
  var self = this;
  var ip = self.loadingIP;

  if(attr){
    self.writeLog("Loaded attributes for ("+self.loadingIP+")",attr);

    //Create the sonos config
    var config = {
      IP:ip,
      CurrentZoneName: attr.CurrentZoneName,
      logging:self._opts.logging,
      urls:self._opts.urls
    };
    var client = self.sonosClient[ip];

    self.emit('register',new NinjaSonosDriver(client,config,self._app));
  }

  //Resetting the value so we can try the next IP.
  self.loadingIP = "";

};

//Checking that the log is not cluttered
//Only write this to the log if logging is set to 2
ninjaSonos.prototype.writeLog = function(){
  if(this._opts.logging == 2)
    this._app.log.info("Ninja Sonos",arguments);
};

//Errors should be logged when logging is set to 1 or 2
ninjaSonos.prototype.writeError =function(){
  if(this._opts.logging == 2 || this._opts.logging == 1)
    this._app.log.error("Ninja Sonos",arguments);
};
