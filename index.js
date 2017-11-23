var Service, Characteristic;

var motionDetected = false;
var rpi433 = require('rpi-433');
var pin;
var timerOff;
var motionService;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-433-MHz-motion-sensor", "MotionSensor433MHz", MotionSensor433MHz);
};

function MotionSensor433MHz(log, config) {
    //config
    this.name = config["name"];
    pin = config["pin"];
    this.on = config["on"];
    this.off = config["off"];
    timerOff = config["timerOff"];
    if (this.name == undefined || pin == undefined || this.on == undefined || this.off == undefined ) {
        throw "Specify name, pin, on code and off code in config file.";
    }

    //setup
    this.log = log;
    this.service = new Service.MotionSensor(this.name);
    this.service
        .getCharacteristic(Characteristic.MotionDetected)
        .on('get', this.getState.bind(this));


    this.rfSniffer = rpi433.sniffer({
        pin: pin,
        debounceDelay: 100
    });

    this.rfSniffer.on('data', function (data) {
        console.log('Code received: '+data.code+' pulse length : '+data.pulseLength);
        if(data.code == this.on && !motionDetected){
            motionDetected = true;
            this.service.setCharacteristic(Characteristic.MotionDetected, motionDetected);
	    
        // If optional property timerOff has value turn off after specified milliseconds
	    if(timerOff != undefined){
	    motionService = this.service;
	    setTimeout(function() {
		    		motionDetected = false;
    				motionService.setCharacteristic(Characteristic.MotionDetected, motionDetected);
			}, timerOff);	 
            
	    }
        }else if(data.code == this.off && motionDetected){
            motionDetected = false;
            this.service.setCharacteristic(Characteristic.MotionDetected, motionDetected);
        }
    }.bind(this));
}

MotionSensor433MHz.prototype.getState = function (callback) {
    callback(null, motionDetected);

};

MotionSensor433MHz.prototype.getServices = function () {
    return [this.service];
};
