# Homebridge GPIO WiringPi - Platform Plugin

***

## WORK IN PROGRESS

Please report issues at https://github.com/rsg98/homebridge-gpio-wpi2/issues

***

Supports triggering General Purpose Input Output (GPIO) pins on the Raspberry Pi.

Uses wiringPi as a back end to give non-root access to GPIO.

## Requirements

-	[Homebridge](https://github.com/nfarina/homebridge) - _HomeKit support for the impatient_
-	[node-wiring-pi](https://github.com/rsg98/node-wiring-pi) - _Node.js bindings to wiringPi_

This version of the plugin expects WiringPi itself to already be installed - see the documentation for [node-wiring-pi](https://github.com/rsg98/node-wiring-pi)
for more details, or just follow the instructions below for Raspbian.

## Installation

1.	Install the wiringpi package using `sudo apt-get install wiringpi`
2.    Install Homebridge using `sudo npm install -g homebridge`
3.	Install this plugin `sudo npm install homebridge-gpio-wpi2`
4.	Update your configuration file - see `config-platform-sample.json` in this repo
5.    Make sure your `homebridge` user is in the `gpio` group.

 ```Shell
  $ sudo usermod -G gpio homebridge
 ```

## Configuration

**The pin numbers used in this config file are the BCM pin numbers, not the physical pins or WiringPi pin numbers.**

You can run `gpio readall` to generate a table showing how the BCM pin numbers map to the physical pins, which varies between models of Raspberry Pi.

```json
{
	"bridge": {
		"name": "Homebridge",
		"username": "CC:22:3D:E3:CE:30",
		"port": 51826,
		"pin": "031-45-155"
    },
    "description": "This is an example configuration file with one fake accessory and one fake platform.",

    "platforms": [{
          "platform" : "WiringPiPlatform",
          "name" : "Pi GPIO (WiringPi)",
          "overrideCache" : "true",
          "autoExport" : "true",
          "gpiopins" : [{
	  	"type":"Switch",
		"name" : "GPIO2",
                "pin"  : 27,
                "enabled" : "true",
                "mode" : "out",
                "pull" : "down",
                "inverted" : "false",
                "duration" : 0,
                "polling" : "true"
	        },{
		"type":"MotionSensor",
                "name" : "GPIO3",
                "pin"  : 22,
                "enabled" : "true",
                "mode" : "in",
                "pull" : "down",
                "inverted" : "false",
                "duration" : 0
          }]
    }]
}

```
### Platform Config Items

| Config Item | Valid Values | Description |
| --- | --- | --- |
| `platform` | `WiringPiPlatform` | Must be set to this value to initialise this plugin |
| `name` | `string` | What you want this platform to be called (appears in the logs and such like) |
| `overrideCache` | `true / false` | Homebridge will cache all your accessories - setting this to true will ignore the cached value (direction, mode, etc.) and read them direcly from your config file |
| `autoExport` | `true / false` | As long as your homebridge user has permission (i.e. is a member of the `gpio` group), setting this to `true` will automatically export the pins via sysfs, meaning you _don't_ need a set-gpio.sh script |


### Pin Config Items

| Config Item | Valid Values | Description |
| --- | --- | --- |
| "type" | "string" | Type of device connected to GPIO. Set to "Switch" for "out" pin mode, or one of "ContactSensor", "LeakSensor", "MotionSensor", "OccupancySensor", or "SmokeSensor" for "in" pin mode | 
| `name` | `string` | Initial display name for the PIN accessory - can be renamed in HomeKit app (e.g. Home) |
| `pin` | `number` | The BCM pin number - see Pin Configuration below |
| `enabled` | `true / false` | Whether you want the module to publish this pin as an accessory |
| `mode` | `out / in` | Mode the pin should operate in |
| `pull` | `up / down / off` | Configuration for the built in Pi pull up resistor |
| `inverted` | `true / false` | Reverse the behaviour of the GPIO pin (0 is on, 1 is off) |
| `duration` | `number` | Pin will turn off after this number of miliseconds |
| `polling` | `true / false` | Whether Homebridge should periodically check the status of the pin (perhaps it's being set by something external to homebridge) |


## Pin Configuration

If you don't use the `autoExport` option above, you'll need to manually configure the relevant GPIO pins using the [gpio utility](https://projects.drogon.net/raspberry-pi/wiringpi/the-gpio-utility/
) included with wiringPi.

This _is not_ necessary if you use autoExport and your homebridge user is a member of the `gpio` group.

```Shell
$ gpio readall
 +-----+-----+---------+------+---+---Pi 2---+---+------+---------+-----+-----+
 | BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
 +-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
 |     |     |    3.3v |      |   |  1 || 2  |   |      | 5v      |     |     |
 |   2 |   8 |   SDA.1 |  OUT | 0 |  3 || 4  |   |      | 5V      |     |     |
 |   3 |   9 |   SCL.1 |   IN | 1 |  5 || 6  |   |      | 0v      |     |     |
 |   4 |   7 | GPIO. 7 |   IN | 1 |  7 || 8  | 1 | ALT0 | TxD     | 15  | 14  |
 |     |     |      0v |      |   |  9 || 10 | 1 | ALT0 | RxD     | 16  | 15  |
 |  17 |   0 | GPIO. 0 |   IN | 0 | 11 || 12 | 1 | IN   | GPIO. 1 | 1   | 18  |
 |  27 |   2 | GPIO. 2 |  OUT | 0 | 13 || 14 |   |      | 0v      |     |     |
 |  22 |   3 | GPIO. 3 |   IN | 0 | 15 || 16 | 0 | IN   | GPIO. 4 | 4   | 23  |
 |     |     |    3.3v |      |   | 17 || 18 | 0 | IN   | GPIO. 5 | 5   | 24  |
 |  10 |  12 |    MOSI |   IN | 0 | 19 || 20 |   |      | 0v      |     |     |
 |   9 |  13 |    MISO |   IN | 0 | 21 || 22 | 0 | IN   | GPIO. 6 | 6   | 25  |
 |  11 |  14 |    SCLK |   IN | 0 | 23 || 24 | 1 | IN   | CE0     | 10  | 8   |
 |     |     |      0v |      |   | 25 || 26 | 1 | IN   | CE1     | 11  | 7   |
 |   0 |  30 |   SDA.0 |   IN | 1 | 27 || 28 | 1 | IN   | SCL.0   | 31  | 1   |
 |   5 |  21 | GPIO.21 |   IN | 1 | 29 || 30 |   |      | 0v      |     |     |
 |   6 |  22 | GPIO.22 |   IN | 1 | 31 || 32 | 0 | IN   | GPIO.26 | 26  | 12  |
 |  13 |  23 | GPIO.23 |   IN | 0 | 33 || 34 |   |      | 0v      |     |     |
 |  19 |  24 | GPIO.24 |   IN | 0 | 35 || 36 | 0 | IN   | GPIO.27 | 27  | 16  |
 |  26 |  25 | GPIO.25 |   IN | 0 | 37 || 38 | 0 | IN   | GPIO.28 | 28  | 20  |
 |     |     |      0v |      |   | 39 || 40 | 0 | IN   | GPIO.29 | 29  | 21  |
 +-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
 | BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
 +-----+-----+---------+------+---+---Pi 2---+---+------+---------+-----+-----+
```

 The pin number specified in the config.json file is the BCM pin number in this table.

 To set up the pins correctly, this module includes a `make-gpio-script` script, which
 will generate a `set-gpio.sh`.  You should run `set-gpio.sh` *before* starting Homebridge
 so that all the pins are configured.  If you start Homebridge using systemd, you can add
 `set-gpio.sh` as a ExecStartPre command in the `homebridge.service` file
 
```Shell
$ node make-gpio-script config.json set-gpio.sh
```

 The gpio tool is setuid root, so this script should be run as the user that runs Homebridge.
 
## Troubleshooting

### Homebridge reports no errors, but nothing is switched on or off

 Check the permissions in /sys/class/gpio/gpioXX - `autoExport` option should have created all these properly, if your Homebridge
 user account has the right permissions (i.e. is a member of the `gpio` group)

 ```Shell
  $ sudo usermod -G gpio homebridge
 ```
 
 If you are not using `autoExport`, you should run the `set-gpio.sh`
 script as the homebridge user (see section above to generate this script):

 ```Shell
 $ node make-gpio-script config.json set-gpio.sh
 ```

## Licence

(The MIT License)

Copyright (c) 2016 Richard Grime richard.grime@gmail.com

Original Project Copyright (c) 2016 James Blanksby james@blanks.by

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
