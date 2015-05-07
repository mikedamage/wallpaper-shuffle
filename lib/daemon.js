#!/usr/bin/env node

/* jshint node: true */

'use strict';

var timer, pattern, interval;
var rotate = require('./rotate-wallpaper');

process.on('message', function(params) {
  pattern  = params.pattern;
  interval = params.interval;
  timer    = setInterval(rotate, interval, pattern);
  rotate(pattern);
  process.send({ running: true });
});

process.on('SIGUSR2', function() {
  if (pattern) {
    rotate(pattern);
  }
});

process.on('SIGINT', function() {
  if (timer) {
    clearInterval(timer);
    timer = 0;
  } else {
    rotate(pattern);
    timer = setInterval(rotate, interval, pattern);
  }
});

process.on('SIGTERM', function() {
  clearInterval(timer);
  process.exit();
});
