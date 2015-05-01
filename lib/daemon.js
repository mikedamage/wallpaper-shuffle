#!/usr/bin/env node

/* jshint node: true */

'use strict';

var wallpapers, lastWallpaper;

var path      = require('path');
var glob      = require('glob');
var wallpaper = require('wallpaper');
var argv      = require('yargs').argv;

var pattern  = argv._[0];
var interval = argv._[1];
var rotate   = function() {

};

rotate();

var rotation = setInterval(rotate, interval);

process.on('SIGINT', function() {
  clearInterval(rotation);
  process.exit();
});
