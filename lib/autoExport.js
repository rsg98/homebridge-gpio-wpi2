'use strict';

const path = require('path');
const sysfs = require('./sysfs.js');

function autoExport(log, gpiopins) {
  log('Exporting GPIO Pins from config file...');

  for (var i in gpiopins)
  {
    log('Exporting and configuring: %s', gpiopins[i].name);
    var gpiopin = new sysfs(gpiopins[i].pin);
    var inverted = (gpiopins[i].inverted === "true");

    gpiopin.export();

    gpiopin.direction = gpiopins[i].mode;
    gpiopin.active_low = ((gpiopins[i].pull === "down") * 1);
    gpiopin.value = (!inverted);
    //gpiopin.edge = gpiopins[i].edge; 
  }
}

module.exports = autoExport;