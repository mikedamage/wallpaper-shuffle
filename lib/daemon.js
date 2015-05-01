#!/usr/bin/env node

var path      = require('path');
var glob      = require('glob');
var wallpaper = require('wallpaper');
var argv      = require('yargs').argv;

var dir      = argv._[0];
var pattern  = argv._[1];
var interval = argv._[2];
var rotate   = function() {

};

rotate();

var rotation = setInterval(rotate, interval);

process.on('SIGINT', function() {
  clearInterval(rotation);
  process.exit();
});
