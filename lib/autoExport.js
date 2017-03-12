'use strict';

const path = require('path');
const sysfs_gpio = require('./sysfs-gpio.js');
const sysfs_pwm = require('./sysfs-pwm.js');

function autoExport(log, gpiopins) {
  log('Exporting GPIO Pins from config file...');

  for (var i in gpiopins)
  {
    var inverted = (gpiopins[i].inverted === "true");

    switch (gpiopins[i].mode) {
      case "pwm":
        log('Exporting and configuring PWM: %s', gpiopins[i].name);
        var pwmpin = new sysfs_pwm(gpiopins[i].pwmchip, gpiopins[i].pin);
        pwmpin.export();

        pwmpin.polarity = (!inverted);
        pwmpin.period = gpiopins[i].period;
        pwmpin.enable = 1;


        break;
      default:
        log('Exporting and configuring: %s', gpiopins[i].name);
        var gpiopin = new sysfs_gpio(gpiopins[i].pin);
        
        gpiopin.export();

        gpiopin.direction = gpiopins[i].mode;
        gpiopin.active_low = ((gpiopins[i].pull === "down") * 1);
        gpiopin.value = (!inverted);
        //gpiopin.edge = gpiopins[i].edge;
        break;
    } 
  }
}

module.exports = autoExport;