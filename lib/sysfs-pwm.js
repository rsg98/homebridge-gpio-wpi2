'use strict';

/*

https://www.kernel.org/doc/Documentation/pwm.txt

If CONFIG_SYSFS is enabled in your kernel configuration a simple sysfs
interface is provided to use the PWMs from userspace. It is exposed at
/sys/class/pwm/. Each probed PWM controller/chip will be exported as
pwmchipN, where N is the base of the PWM chip. Inside the directory you
will find:

npwm - The number of PWM channels this chip supports (read-only).

export - Exports a PWM channel for use with sysfs (write-only).

unexport - Unexports a PWM channel from sysfs (write-only).

The PWM channels are numbered using a per-chip index from 0 to npwm-1.

When a PWM channel is exported a pwmX directory will be created in the
pwmchipN directory it is associated with, where X is the number of the
channel that was exported. The following properties will then be available:

period - The total period of the PWM signal (read/write).
	Value is in nanoseconds and is the sum of the active and inactive
	time of the PWM.

duty_cycle - The active time of the PWM signal (read/write).
	Value is in nanoseconds and must be less than the period.

polarity - Changes the polarity of the PWM signal (read/write).
	Writes to this property only work if the PWM chip supports changing
	the polarity. The polarity can only be changed if the PWM is not
	enabled. Value is the string "normal" or "inversed".

enable - Enable/disable the PWM signal (read/write).
	0 - disabled
	1 - enabled

*/

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
  //TODO: Throw exception if pin number > (npwm - 1)
  this.pin = pin;
  this.pwmchip = "pwmchip" + pwmchip.toString();

  this.ChipExportPath = path.join(SYSFS_PATH, this.pwmchip, 'export');
  this.ChipUnexportPath = path.join(SYSFS_PATH, this.pwmchip, 'unexport');
  
  let root = path.join(SYSFS_PATH, this.pwmchip, 'pwm') + pin.toString();
  
  this.path = {
    root:       root,
    enable:     path.join(root, 'enable'),
    period:     path.join(root, 'period'),
    duty_cycle: path.join(root, 'duty_cycle'),
    polarity:   path.join(root, 'polarity')
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

    //Trigger udev to set permissions on the new pwm[0-1] directories
    write('add', path.join(SYSFS_PATH, this.pwmchip, 'uevent'));
  },

  get period() {
    return read(this.path.period);
  },

  set period(val) {
    //TODO cannot be less than 500? (Or is this set by the )
      write(this.path.period, val);
  },

  get duty_cycle() {
    return read(this.path.duty_cycle);
  },

  set duty_cycle(val) {
    //TODO - cannot be bigger than period
        write(this.path.duty_cycle, val);
  },

  get polarity() {
    return Number.parseInt(read(this.path.polarity));
  },

  set polarity(val) {
    writeBool(this.path.polarity, val.toString());
  },

  export: function() {
    if(!fs.existsSync(this.path.root.toString())) {
      write(this.ChipExportPath, this.pin.toString());
      //Manually trigger udev - pwm lib doesn't seem to
      write(path.join(SYSFS_PATH, this.pwmchip, "uevent"), "add");
      //Errors being thrown trying to set direction, etc. immediately after export (perhaps fssync hasn't run?)
      sleep.sleep(2);
    }
  },

  unexport: function() {
    if(!fs.existsSync(this.path.root.toString())) {
      write(this.ChipUnexportPath, this.pin.toString());
      //Manually trigger udev - pwm lib doesn't seem to
      write(path.join(SYSFS_PATH, this.pwmchip, "uevent"), "remove");
    }
  }

}

module.exports = sysfs_pwm;