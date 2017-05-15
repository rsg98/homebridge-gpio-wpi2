#!/usr/bin/env node

//Run me as root to start the PWM clocks (otherwise you get no output)

const wpi = require('node-wiring-pi');

wpi.wiringPiSetup();

//Run PWM in mark:space mode
wpi.pwmSetMode(wpi.PWM_MODE_MS);

//pwmFrequency in Hz = 19.2e6 Hz / pwmClock / pwmRange

//Divisor for clock - 96 gives a 2kHz signal
wpi.pwmSetClock(96);