/* Ninja Thermostat heatmiser driver.
 * This driver is created by Stephan van Rooij.
 * It uses node-sonos from Ben Evans
 */
var util = require('util'),
    stream = require('stream');

var log = console.log;

util.inherits(Driver,stream);
util.inherits(SonosDevice,stream);


function Driver(opts,app) {
	this._app = app;
	this._opts = opts;
	
	this._opts.sonoses = opts.sonoses || {};

	this._devices = {};

	var initialised = false;

	app.on('client::up',function(){
	if (!initialised) { //This is to make sure the devices only get set up once
		initialised = true;
		for (var ip in opts.sonoses) {
			this.add(opts.sonoses[ip]);
		}
	}

	
	}.bind(this));

}

Driver.prototype.config = function(rpc,cb) {

  var self = this;

	if (!rpc) {
		return cb(null,{"contents":[
			{ "type": "paragraph", "text": "Welcome to the Sonos mediaplayer driver."},
			{ "type": "submit", "name": "Add player", "rpc_method": "addModal" },
			{ "type": "submit", "name": "Say hello", "rpc_method": "rickroll" }
		]});
	}

	switch (rpc.method) {
		case 'addModal':
    		cb(null, {
        	"contents":[
          		{ "type": "paragraph", "text":"Please enter the IP address and a nickname of the sonos player"},
          		{ "type": "input_field_text", "field_name": "ip", "value": "", "label": "IP/Host", "placeholder": "x.x.x.x", "required": true},
          		{ "type": "input_field_text", "field_name": "name", "value": "", "label": "Name", "placeholder": "LivingRoom", "required": true},
          		{ "type": "submit", "name": "Add", "rpc_method": "add" },
          		{ "type":"close", "text":"Cancel"}
        	]
      	});
      	break;
    case 'add':
      var devOptions = {"ip": rpc.params.ip, "name": rpc.params.name}
      self._opts.sonoses[rpc.params.ip] = devOptions;
      self.save();
      self.add(devOptions);
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"Sonos at " + rpc.params.ip + " with options (name : " + rpc.params.name + ") is added."},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    case 'rickroll':
      self.rickRoll();
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"Hello Rick!"},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    default:
      log('Unknown rpc method', rpc.method, rpc);
  }
};

Driver.prototype.rickRoll = function() {
	for(var ip in this._devices) {
		var device = this._devices[ip];
		log('RickRoll: ',device.name);
		//Hier moet nog iets komen....
		//device.say('Hello this is sonos speaking');
		device.dog();
	}
}

Driver.prototype.add = function(devOptions) {
	//Don't add if already exists
	if(this._devices[devOptions.ip]) {
		return;
	}
	
	this._app.log.info('Adding Sonos:' + devOptions.name + ' (' + devOptions.ip + ')');
	var self = this;
	var sonosDevice = new SonosDevice(devOptions,self._app);
	self._devices[devOptions.ip] = sonosDevice;
	
	//Wait a few seconds, to be sure it is connected to the cloud.
	setTimeout(function() {
		Object.keys(sonosDevice.devices).forEach(function(id) {
			self._app.log.info('Adding sub-device', id, sonosDevice.devices[id].G);
			//sonosDevice.devices[id].emit('register');
			
			self.emit('register', sonosDevice.devices[id]);
		});
		sonosDevice.actuate();
	},4000);

}
module.exports = Driver;

function SonosDevice(options,app) {

	this.host =options.ip;

	this.name = options.name;
	this.timeout = (options.timeout > 30)?options.timeout : 240;
	this._app = app;
	
	
	var Sonos = require('sonos').Sonos;
	this.sonos = new Sonos(this.host);
	
	var self = this;
	this.playing = 1;
	
// 	function tts() { //Copied from XMBC driver
// 		this.readable = true;
// 		this.writeable = true;
// 		this.V = 0;
// 		this.D = 240;
// 		this.G = self.name.replace(/[^a-zA-Z0-9]/g, '')+'tts';
// 		
// 		this.device = self;
// 	}
// 	
// 	util.inherits(tts, stream);
// 	
// 	tts.prototype.write = function(data){
// 		log('Sonos - received TTS',data);
// 		this.device.say(data);
// 		
// 	}
	
	function playSwitch() {
		this.readable = true;
		this.writeable = true;
		this.V = 0;
		this.D = 238;
		this.G = self.name.replace(/[^a-zA-Z0-9]/g, '')+'play';
		this.device = self;
	}
	
	util.inherits(playSwitch,stream);
	
	playSwitch.prototype.write = function(data){
		//log("Playstate recieved "+data);
		
		if(data == 0) {
			this.device.pause();
		} else {
			this.device.resume();
		}
		
		playing = data;
	}
	
	function gong() {
		this.readable = true;
		this.writeable = true;
		this.V = 0;
		this.D = 238;
		this.G = self.name.replace(/[^a-zA-Z0-9]/g, '')+'gong';
		this.device = self;
	}
	
	util.inherits(gong,stream);
	
	gong.prototype.write = function(data){
		log("Gong recieved "+data);
		if(data == 1) {
			this.device.dog();
		}
	}
		
	
	//All devices
	this.devices = {
// 		tts : new tts(),
		playSwitch: new playSwitch(),
		gong : new gong()
	};
	
	
// 	//Then set a timeout.
	this.interval = setInterval(function() {
		self.actuate();
	},1000*this.timeout);
}

//Sadly enough the google TTS needs a certain user agent.
//I need to proxy this request, but not sure I want to
// SonosDevice.prototype.say = function(text,lang) {
// 	if (text == undefined) text = 'Hello Stefan';
// 	if (lang == undefined) lang = 'en';
// 	
// 	text = text.replace(/ /g,'+');
// 	var url = 'http://translate.google.com/translate_tts?tl='+lang+'&q='+text;
// 	log(url);
// 	//this.sonos.queueNext(url, function(err, playing) {
// 	this.play(url);
// }

SonosDevice.prototype.actuate = function(){
	//Here should be checked if the music is playing.
	this.devices.playSwitch.emit('data', this.playing);
	this.devices.gong.emit('data',0);
}

SonosDevice.prototype.pause = function(){
	this.sonos.pause(function(err) {
		if(err)
			log(err);
	});
}

//Without url is resumes playing.
//Else it should play the called url
SonosDevice.prototype.play = function(url) {
	var self = this;
	if(url == undefined || url == null) {
		this.sonos.play(function(err,playing){
			if(err)
				log(err);
		});
	} else {
		//First Flush the playlist
		this.sonos.flush(function(err,flushed) {
			if(err == null) {
				//Queue the url
				self.sonos.play(url, function(err, playing) {
					if(err == null) {
						//Resume playing.
						self.resume();
					}
				});
			}
		});
	}
}

//Resume playing after pause
SonosDevice.prototype.resume = function(){
	this.play();
}

//Play the sound of a dog
//I'm open to suggestions
SonosDevice.prototype.dog = function(){
	this.play('http://soundjax.com/reddo/92064%5Enightdog.mp3');
}
