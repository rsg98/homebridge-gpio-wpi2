//var wpi = require('wiring-pi-rsg98');
var gpioExports = require('./readExports')();

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  
  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-gpio-wpi2", "WiringPiPlatform", WPiPlatform, false);
}

// Platform constructor
function WPiPlatform(log, config, api) {
  log("WiringPi Platform Init");
  var platform = this;
  this.log = log;
  this.config = config;
  this.gpiopins = this.config.gpiopins || [];
  this.accessories = [];

  //Configure wiring pi using 'sys' mode - requires pins to
  //have been exported via `gpio export`
  //wpi.setup('sys');

  if (api) {
      // Save the API object as plugin needs to register new accessory via this object.
      this.api = api;
      platform.log("homebridge API version: " + api.version);

      // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
      // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
      // Or start discover new accessories
      this.api.on('didFinishLaunching', function() {
        platform.log("Loading cached GPIO pins complete");
        for ( var i in this.gpiopins ) { this.addGPIOPin(this.gpiopins[i]); }
      }.bind(this));
  }
}

// Function invoked when homebridge tries to restore cached accessory
WPiPlatform.prototype.configureAccessory = function(accessory) {
  this.log(accessory.displayName, "Configure GPIO Pin", accessory.UUID);
  var platform = this;

  // set the accessory to reachable if plugin can currently process the accessory
  // otherwise set to false and update the reachability later by invoking
  // accessory.updateReachability()
  accessory.reachable = true;

  // Handle the 'identify' event
  // TODO: run 3000ms on/off?
  accessory.on('identify', function(paired, callback) {
    platform.log(accessory.displayName, "Identify!!!");
    callback();
  });

  //Wire up switch events (get / set) for Service.Switch
  if (accessory.getService(Service.Switch)) {
    accessory.getService(Service.Switch)
    .getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));
  }

  this.accessories.push(accessory);
}

//Handler will be invoked when user try to config your plugin
//Callback can be cached and invoke when nessary
WPiPlatform.prototype.configurationRequestHandler = function(context, request, callback) {
  console.log("Not Implemented");
}

// Sample function to show how developer can add accessory dynamically from outside event
WPiPlatform.prototype.addGPIOPin = function(gpiopin) {
  var platform = this;
  var uuid;

  uuid = UUIDGen.generate(gpiopin.name);

  var uuidExists = this.accessories.filter(function(item) {
    return item.UUID == uuid;
  }).length;

  if (uuidExists == 0) {
    this.log("New GPIO from config.json: " + gpiopin.name + " (" + gpiopin.pin + ")");
  
    var newAccessory = new Accessory(gpiopin.name, uuid);
    
    newAccessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, platform.config.manufacturer ? platform.config.manufacturer : "Raspberry Pi Foundation")
      .setCharacteristic(Characteristic.Model, platform.config.model ? platform.config.model : "Pi GPIO")
      .setCharacteristic(Characteristic.SerialNumber, platform.config.serial ? platform.config.serial : "Default-SerialNumber");

    newAccessory.addService(Service.Switch, gpiopin.name);

    newAccessory.context = gpiopin;
        
    this.configureAccessory(newAccessory);
    this.api.registerPlatformAccessories("homebridge-WPiPlatform", "WiringPiPlatform", [newAccessory]);
  }
}

WPiPlatform.prototype.getOn = function(callback) {
    // inverted XOR pin_value
    console.log("Pin ON");
    var on = 1;
    callback(null, on);
}

WPiPlatform.prototype.setOn = function(on, callback) {
    // inverted XOR pin_value
    console.log("Pin to " + on);

    callback(null, on);
}


WPiPlatform.prototype.updateAccessoriesReachability = function() {
  this.log("Update Reachability");
  for (var index in this.accessories) {
    var accessory = this.accessories[index];
    accessory.updateReachability(false);
  }
}

// Sample function to show how developer can remove accessory dynamically from outside event
WPiPlatform.prototype.removeAccessory = function() {
  this.log("Remove Accessory");
  this.api.unregisterPlatformAccessories("homebridge-WPiPlatform", "WPiPlatform", this.accessories);

  this.accessories = [];
}

function GPIOAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.pin = config['pin'];
    this.duration = config['duration'];

    //Config option to invert behaviour of GPIO output - i.e. 0 = On, 1 = Off.
    this.inverted = ( config['inverted'] === "true" );

    this.service = new Service.Switch(this.name);
    this.informationService = new Service.AccessoryInformation();

    if (!this.pin) throw new Error('You must provide a config value for pin.');

    //Use pin numbering based on /sys/class/gpio exports (non-root)
    wpi.setup('sys');

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, cpu['Hardware'])
      .setCharacteristic(Characteristic.Model, cpu['Revision'])
      .setCharacteristic(Characteristic.SerialNumber, cpu['Serial'])

    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));

}

GPIOAccessory.prototype.getServices = function() {
    return [this.informationService, this.service];
}

GPIOAccessory.prototype.getOn = function(callback) {
    // inverted XOR pin_value
    var on = ( this.inverted != wpi.digitalRead(this.pin) );
    callback(null, on);
}

GPIOAccessory.prototype.setOn = function(on, callback) {
    // Handle inverted configurations by evaluating the
    //  inverse of the inverted config bool, multipled by 1 to
    //  give a 1 or 0 result for pinAction
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
        self.pinAction(this.inverted * 1);
    }, this.duration);
}

var is_int = function(n) {
    return n % 1 === 0;
}

var is_defined = function(v) {
    return typeof v !== 'undefined';
}
