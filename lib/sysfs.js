'use strict';

const path = require('path');
const fs = require('fs');

const SYSFS_PATH = '/sys/class/gpio';
const EXPORT_PATH = path.join(SYSFS_PATH, 'export');
const UNEXPORT_PATH = path.join(SYSFS_PATH, 'unexport');

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

function sysfs(pin) {
  this.pin = pin;

  let root = path.join(SYSFS_PATH, 'gpio') + pin.toString();
  this.path = {
    root:      root,
    value:     path.join(root, 'value'),
    direction: path.join(root, 'direction'),
    edge:      path.join(root, 'edge'),
    activeLow: path.join(root, 'active_low')
  }
}

sysfs.prototype = {

  get value() {
    return Number.parseInt(read(this.path.value));
  },

  set value(val) {
    writeBool(this.path.value, val.toString());
  },

  get direction() {
    return read(this.path.direction);
  },

  set direction(val) {
      if (['in', 'out'].indexOf(val) > -1) {
        write(this.path.direction, val);
      }
  },

  get edge() {
    return read(this.path.edge);
  },

  set edge(val) {
      if (['none', 'rising', 'falling', 'both'].indexOf(val) > -1) {
        write(this.path.edge, val);
      }
  },

  get activeLow() {
    return Number.parseInt(read(this.path.activeLow));
  },

  set activeLow(val) {
    writeBool(this.path.activeLow, val.toString());
  },

  export: function() {
    write(EXPORT_PATH, this.pin.toString());
  },

  unexport: function() {
    write(UNEXPORT_PATH, this.pin.toString());
  }

}

module.exports = sysfs;