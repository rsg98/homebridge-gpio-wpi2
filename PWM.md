# Pulse Width Modulation (PWM) Mode

THis plugin supports PWM via the SYSFS interface.  If you have PWM hardware that can be accessed via

```
/sys/class/pwm/...
```

...then you should be good to go!

## Why?

PWM will let you create (for example) dimmable lights.

## Raspberry Pi Built-in PWM Hardware

This has been tested on a Pi 3, Raspbian Jessie with a kernel version 4.4.48-v7+

Note that using PWM interferes with analog audio on the Pi - so if you want both PWM and analog audio, consider some external PWM hardware, like the AdaFruit one:

https://www.adafruit.com/product/815 (not yet tested with this plugin, YMMV!)

### Configure Overlays

Set up the PWM overlays, as per the instructions at:

* http://librpip.frasersdev.net/peripheral-config/pwm0and1/
* https://github.com/raspberrypi/firmware/blob/master/boot/overlays/README

For example, ``/boot/config.txt`` for both PWM channels would look like:

```
dtoverlay=pwm-2chan,pin=12,func=4,pin2=13,func2=4
```

Reboot, and you should get a:

```
/sys/class/pwm/pwmchip0
```

Install script...

Put udev rules in ``/etc/udev/rules.d``

After enabling, write echo "add" > pwmchip0/uevent to trigger udev rules to run on new pwm[0-1] directories

Use wirinpi to trigger the clocks to start (needs to happen before exporting pins)...
