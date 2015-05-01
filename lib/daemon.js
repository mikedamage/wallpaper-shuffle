#!/usr/bin/env node

/* jshint node: true */

'use strict';

var wallpapers;

var path         = require('path');
var glob         = require('glob');
var wallpaper    = require('wallpaper');
var Random       = require('random-js');
var HistoryQueue = require('./history-queue');
var argv         = require('yargs').argv;

var engine   = Random.engines.nativeMath;
var pattern  = argv._[0];
var interval = argv._[1];
var history  = new HistoryQueue(3);
var rotate   = function rotate() {
  var idx   = Random.integer(0, (wallpapers.length - 1))(engine);
  var paper = wallpapers[idx];

  if (history.includes(paper)) {
    return rotate();
  }

  history.add(paper);
  wallpaper.set(paper);
};

wallpapers = glob.sync(pattern);

rotate();

var rotation = setInterval(rotate, interval);

process.on('SIGINT', function() {
  clearInterval(rotation);
  process.exit();
});
