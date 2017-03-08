#!/usr/bin/env node

//Run me as root to start the PWM clocks (otherwise you get no output)

const wpi = require('node-wiring-pi');

wpi.wiringPiSetup();

//Run PWM in mark:space mode
wpi.pwmSetMode(wpi.PWM_MODE_MS);

//Divisor for clock
wpi.pwmSetClock(25);