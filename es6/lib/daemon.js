#!/usr/bin/env node

/* jshint node: true */

'use strict';

var timer, pattern, interval;
var rotate   = require('./rotate-wallpaper');
var notifier = require('node-notifier');
var notify   = false;

process.on('message', function(params) {
  pattern  = params.pattern;
  interval = params.interval;
  timer    = setInterval(rotate, interval, pattern);
  notify   = params.notify;

  rotate(pattern, params.notify).then(function() {
    process.send({ running: true });
  });
});

process.on('SIGUSR1', function() {
  if (timer) {
    clearInterval(timer);
    timer = 0;

    if (notify) {
      notifier.notify({
        title: 'Wallpaper Shuffle',
        message: 'Paused!'
      });
    }
  } else {
    if (notify) {
      notifier.notify({
        title: 'Wallpaper Shuffle',
        message: 'Unpaused!'
      });
    }

    rotate(pattern, notify).then(function() {
      timer = setInterval(rotate, interval, pattern, notify);
    });
  }
});

process.on('SIGUSR2', function() {
  if (pattern) {
    rotate(pattern, notify);
  }
});

process.on('SIGTERM', function() {
  clearInterval(timer);
  process.exit();
});
