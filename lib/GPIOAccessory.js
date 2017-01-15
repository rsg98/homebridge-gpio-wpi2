'use strict';

var Service, Characteristic

function GPIOAccessory(log, accessory, wpi, onChar)
{
    var self = this;

    this.accessory = accessory;
    this.log = log;
    this.context = accessory.context;
    this.wpi = wpi;
    this.onChar = onChar;
    this.inverted = (this.context.inverted === "true");
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

// Check value is a +ve integer
var is_int = function(n) {
    return (n > 0) && (n % 1 === 0);
}

var is_defined = function(v) {
    return typeof v !== 'undefined';
}

module.exports = GPIOAccessory;