var stream = require('stream');
var util = require('util');

util.inherits(NinjaSonosDriver,stream);
module.exports = NinjaSonosDriver;

var POLL_INTERVAL = 20;

function guidSafe(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '');
}

function NinjaSonosDriver(){

}
