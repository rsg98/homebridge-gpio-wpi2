'use strict';

const EventEmitter = require('events');
const SysFS = require('./sysfs.js');
const FS = require('fs');
const Epoll = require('epoll').Epoll;

var Service, Characteristic

class GPIOAccessory extends EventEmitter {

constructor(log, accessory, wpi, onChar)
{
    super();
    var self = this;

    this.accessory = accessory;
    this.log = log;
    this.context = accessory.context;
    this.wpi = wpi;
    this.onChar = onChar;
    this.inverted = ((this.context.inverted === "true") || (this.context.inverted == true));
    
    switch(this.context.mode) {
        case "out":
            //Set the default pin state to off (to handle inverted pins)
            this.pinAction(this.inverted * 1);
            break;
        case "in":
            break;
        default:
            break;
    }
}
}

GPIOAccessory.prototype.getOn = function(callback) {
    // inverted XOR pin_value
    var on = ( this.inverted != this.wpi.digitalRead(this.context.pin) );
    callback(null, on);
}

GPIOAccessory.prototype.setOn = function(on, callback) {
    var duration = this.context.duration;

    if (on) {
        this.pinAction(!this.inverted * 1);
        if (is_defined(duration) && is_int(duration)) {
            this.pinTimer()
        }
        callback(null);
    } else {
        this.pinAction(this.inverted * 1);
        callback(null);
    }
}

GPIOAccessory.prototype.pinAction = function(action) {
    this.log('Turning ' + (action == (!this.inverted * 1) ? 'on' : 'off') + ' pin #' + this.context.pin);

    this.wpi.digitalWrite(this.context.pin, action);
    var success = (this.wpi.digitalRead(this.context.pin) == action);
    return success;
}

GPIOAccessory.prototype.pinTimer = function() {
    var self = this;
    setTimeout(function() {
        self.log('Timer expired ' + self.context.duration + 'ms');
        self.pinAction(self.inverted * 1);
        self.onChar.getValue();
    }, self.context.duration);
}

GPIOAccessory.prototype.interruptPoll = function(callback) {
    var self = this;

    var poller = new Epoll(function(err, fd, events) {
        if (err) throw err
        FS.readSync(fd, new Buffer(1), 0, 1, 0);
        callback(self.context.pin);
    });

    var sysfs = new SysFS(this.context.pin);

    //Set hardware interrupt on both edges
    sysfs.edge = 'both';
    //sysfs.activeLow = (!self.inverted * 1);

    var valuefd = FS.openSync(sysfs.valuePath, 'r');
        
    //Read to clear any pending interrupts
    FS.readSync(valuefd, new Buffer(1), 0, 1, 0);
    poller.add(valuefd, Epoll.EPOLLPRI);
}

// Check value is a +ve integer
var is_int = function(n) {
    return (n > 0) && (n % 1 === 0);
}

var is_defined = function(v) {
    return typeof v !== 'undefined';
}

module.exports = GPIOAccessory;
