function GPIOAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.pin = config['pin'];
    this.duration = config['duration'];

    //Config option to invert behaviour of GPIO output - i.e. 0 = On, 1 = Off.
    this.inverted = ( config['inverted'] === "true" );

    this.service = new Service.Switch(this.name);
    this.informationService = new Service.AccessoryInformation();

    this.log("Configuring accessory %s (homebridge-gpio-wpi version %s)", this.name, pkginfo.version);
    
    if (!this.pin) throw new Error('Pin not configured.');
    var currentPin = this.pin;
    var currentPinStatus = gpioExports.find( p => p.pin === currentPin );
    
    if(currentPinStatus.error) {
      throw new Error('Pin ' + this.pin + ' is not readable (' + currentPinStatus.error.code + ').  Did you run gpio export as the right user?');
    } else {
      if (currentPinStatus.direction != 'out') {
        throw new Error('Pin ' + this.pin + ' is not configured for OUTPUT.  Run gpio mode -g ' + this.pin + ' out');
      }
    }

    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));
}

GPIOAccessory.prototype.getServices = function() {
    return [this.service];
}

GPIOAccessory.prototype.getOn = function(callback) {
    // inverted XOR pin_value
    var on = ( this.inverted != wpi.digitalRead(this.pin) );
    callback(null, on);
}

GPIOAccessory.prototype.setOn = function(on, callback) {
    if (on) {
        this.pinAction(!this.inverted * 1);
        if (is_defined(this.duration) && is_int(this.duration)) {
            this.pinTimer()
        }
        callback(null);
    } else {
        this.pinAction(this.inverted * 1);
        callback(null);
    }
}

GPIOAccessory.prototype.pinAction = function(action) {
    this.log('Turning ' + (action == (!this.inverted * 1) ? 'on' : 'off') + ' pin #' + this.pin);

    var self = this;
    wpi.digitalWrite(self.pin, action);
    var success = (wpi.digitalRead(self.pin) == action);
    return success;
}

GPIOAccessory.prototype.pinTimer = function() {
    var self = this;
    setTimeout(function() {
        self.log('Timer expired ' + self.duration + 'ms');
        self.pinAction(self.inverted * 1);
    }, self.duration);
}

// Check value is a +ve integer
var is_int = function(n) {
    return (n > 0) && (n % 1 === 0);
}

var is_defined = function(v) {
    return typeof v !== 'undefined';
}
