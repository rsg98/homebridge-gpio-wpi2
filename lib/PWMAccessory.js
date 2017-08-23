'use strict';

const EventEmitter = require('events');
const SysFS = require('./sysfs-pwm.js');
const FS = require('fs');

var Service, Characteristic

class PWMAccessory extends EventEmitter {
    constructor(log, accessory, wpi)
    {
        super();
        var self = this;

        this.accessory = accessory;
        this.log = log;
        this.context = accessory.context;

        if (this.context.mode != "pwm") { 
            throw Error("Tried to create a PWMAccessory where accessory mode is not pwm");
        }

        this.wpi = wpi;
        this.inverted = (this.context.inverted === "true");

        this.sysfs = new SysFS(this.context.pwmchip, this.context.pin);
    }
}

PWMAccessory.prototype.getOn = function(callback) {
    // inverted XOR pin_value
    var on = ( this.inverted != this.sysfs.enable );
    callback(null, on);
}

PWMAccessory.prototype.setOn = function(on, callback) {
    if (on) {
        this.pinAction(!this.inverted * 1);
        callback(null);
    } else {
        this.pinAction(this.inverted * 1);
        callback(null);
    }
}

PWMAccessory.prototype.setBrightness = function(level, callback) {
    //Set duty cycle...
    //Check what hap-nodejs uses as a value range.
}

PWMAccessory.prototype.pinAction = function(action) {
    this.log('Turning ' + (action == (!this.inverted * 1) ? 'on' : 'off') + ' pin #' + this.context.pin);

    this.sysfs.enable(action);
    var success = (this.sysfs.enable == action);
    return success;
}

// Check value is a +ve integer
var is_int = function(n) {
    return (n > 0) && (n % 1 === 0);
}

var is_defined = function(v) {
    return typeof v !== 'undefined';
}

module.exports = PWMAccessory;