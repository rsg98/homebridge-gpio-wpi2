//var wpi = require('node-wiring-pi');
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
  log("WORK IN PROGRESS... I DON'T WORK YET!");
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
        
        //Start polling all pins...
        this.statePolling();
      }.bind(this));
  }
}

// Function invoked when homebridge tries to restore cached accessory
WPiPlatform.prototype.configureAccessory = function(accessory) {
  this.log(accessory.displayName, "Configure GPIO Pin", accessory.UUID);
  var platform = this;
  accessory.reachable = true;

  if(platform.config.overrideCache === "true") {
    var newContext = platform.gpiopins.find( p => p.name === accessory.context.name );
    accessory.context = newContext;
  }

  if (accessory.getService(Service.Switch) && accessory.context.direction === "out") {
    accessory.getService(Service.Switch)
      .getCharacteristic(Characteristic.On)
      .on('get', this.getOn.bind(this))
      .on('set', this.setOn.bind(this));
  }

  if (accessory.getService(Service.ContactSensor) && accessory.context.direction === "in") {
    accessory.getService(Service.ContactSensor)
      .getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this.getOn.bind(this));
  }

  // Handle the 'identify' event
  accessory.on('identify', function(paired, callback) {
    platform.log(accessory.displayName, "Identify!!!");
    // TODO: run 3000ms on/off?
    callback();
  });


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

    switch(gpiopin.mode) {
      case "out":
        newAccessory.addService(Service.Switch, gpiopin.name);
        break;
      case "in":
        newAccessory.addService(Service.ContactSensor, gpiopin.name);
        break;
      default:
        platform.log("WARNING: Unsupported GPIO Pin Mode (%s)", gpiopin.mode);
    }
    
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
WPiPlatform.prototype.removeAccessory = function(accessory) {
  this.log("Remove Accessory");
  this.api.unregisterPlatformAccessories("homebridge-WPiPlatform", "WPiPlatform", this.accessories);

  this.accessories = [];
}


// Method for state periodic update
WPiPlatform.prototype.statePolling = function () {
  var platform = this;
  
  // Clear polling
  //clearTimeout(this.tout);

  console.log("Polling...");
  // Setup periodic update with polling interval
  this.tout = setTimeout(function () {
        // Update states for all HomeKit accessories
        for (var deviceID in platform.accessories) {
          var accessory = platform.accessories[deviceID];
          var gpioState = platform.prototype.getOn();
          if (accessory.getService(Service.Switch) && accessory.context.direction === "out") {
            accessory.getService(Service.Switch)
              .getCharacteristic(Characteristic.On)
              .setValue(gpioState);
          }

          if (accessory.getService(Service.ContactSensor) && accessory.context.direction === "in") {
            accessory.getService(Service.ContactSensor)
              .getCharacteristic(Characteristic.ContactSensorState)
              .SetValue(gpioState);
          }
        }
      
      // Setup next polling
      self.statePolling();
  }, 2000);
}


