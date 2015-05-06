#!/usr/bin/env node

/* jshint node: true */

'use strict';

var wallpapers;

var path            = require('path');
var argv            = require('yargs').argv;
var rotateWallpaper = require('./rotate-wallpaper');
var pattern         = argv._[0];
var interval        = argv._[1];

console.log('PID: %d', process.pid);

rotateWallpaper(pattern, true);

var rotation = setInterval(rotateWallpaper, interval, pattern, true);

process.on('SIGINT', function() {
  clearInterval(rotation);
  process.exit();
});

// Force a rotation on SIGUSR2
process.on('SIGUSR2', function() {
  rotateWallpaper(pattern, true);
});

// Print uptime to STDOUT on SIGUSR1
process.on('SIGUSR1', function() {
  console.log('up for %s seconds', process.uptime());
});
