'use strict';

const path = require('path');
const fs = require('fs');
const sleep = require('sleep');

const SYSFS_PATH = '/sys/class/pwm';

function read(file) {
  return fs.readFileSync(file, { encoding: 'ascii' }).toString().trim();
}

function write(file, value) {
  fs.writeFileSync(file, value.toString(), { encoding: 'ascii'});
}

function writeBool(file, value) {
    if ((value % 1 === 0) && (value >= 0) && (value <= 1)) {
        fs.writeFileSync(file, value.toString(), { encoding: 'ascii'});
    }
}

function sysfs_pwm(pwmchip, pin) {
  this.pin = pin;
  this.pwmchip = pwmchip;

  this.ChipExportPath = path.join(SYSFS_PATH, pwmchip, 'export');
  this.ChipUnexportPath = path.join(SYSFS_PATH, pwmchip, 'unexport');
  
  let root = path.join(SYSFS_PATH, pwmchip, 'pwm') + pin.toString();
  
  this.path = {
    root:      root,
    enable:     path.join(root, 'enable'),
    period: path.join(root, 'period'),
    duty_cycle:      path.join(root, 'duty_cycle'),
    polarity: path.join(root, 'polarity')
  }
}

sysfs_pwm.prototype = {
  get pinNumber() {
    return this.pin;
  },

  get pwmChip() {
    return this.pwmchip;
  },

  get enable() {
    return Number.parseInt(read(this.path.enable));
  },

  set enable(val) {
    writeBool(this.path.enable, val.toString());
  },

  get period() {
    return read(this.path.period);
  },

  set period(val) {
      write(this.path.period, val);
  },

  get duty_cycle() {
    return read(this.path.duty_cycle);
  },

  set duty_cycle(val) {
        write(this.path.duty_cycle, val);
  },

  get polarity() {
    return Number.parseInt(read(this.path.polarity));
  },

  set activeLow(val) {
    writeBool(this.path.polarity, val.toString());
  },

  export: function() {
    if(!fs.existsSync(this.path.root.toString())) {
      write(this.ChipExportPath, this.pin.toString());
      //Manually trigger udev - pwm lib doesn't seem to
      write(path.join(SYSFS_PATH, this.pwmchip, "uevent", "add"));
      //Errors being thrown trying to set direction, etc. immediately after export (perhaps fssync hasn't run?)
      sleep.sleep(2);
    }
  },

  unexport: function() {
    if(!fs.existsSync(this.path.root.toString())) {
      write(this.ChipUnexportPath, this.pin.toString());
      //Manually trigger udev - pwm lib doesn't seem to
      write(path.join(SYSFS_PATH, this.pwmchip, "uevent", "remove"));
    }
  }

}

module.exports = sysfs_pwm;