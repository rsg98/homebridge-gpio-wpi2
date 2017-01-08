var fs = require('fs');

const SYSFS_GPIO = '/sys/class/gpio/gpio';

function ReadExport (pin) {
      var gpio;

      try {
          fs.accessSync(SYSFS_GPIO + pin, fs.F_OK);

          var direction = fs.readFileSync(SYSFS_GPIO + pin + '/direction', 'utf8');
          var value = fs.readFileSync(SYSFS_GPIO + pin + '/value', 'utf8');

          var gpio = {
            'pin': pin,
            'direction': direction.trim(),
            'value': value.trim()
          };

      } catch (e) {
          var gpio = { 'pin': pin, 'error': e.code };
      }

    return(gpio);
}

module.exports = ReadExport;