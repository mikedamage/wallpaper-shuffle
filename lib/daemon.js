#!/usr/bin/env node

/* jshint node: true */

'use strict';

var timer, pattern;
var rotate = require('./rotate-wallpaper');

process.on('message', function(params) {
  pattern = params.pattern;
  timer   = setInterval(rotate, params.interval, pattern);
  rotate(pattern);
  process.send({ running: true });
});

process.on('SIGUSR2', function() {
  if (pattern) {
    rotate(pattern);
  }
});

process.on('SIGTERM', function() {
  clearInterval(timer);
  process.exit();
});
