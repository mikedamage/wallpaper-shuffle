#!/usr/bin/env node

import { rotateWallpaper } from './rotate-wallpaper';
import notifier            from 'node-notifier';

let instance;

class Daemon {
  constructor(params) {
    this.pattern  = params.pattern;
    this.interval = params.interval;
    this.notify   = !!params.notify || false;

    console.log('Starting wallpaper-shuffle daemon.');
    console.log('Interval: ' + this.interval);
    console.log('Pattern: ' + this.pattern);
  }

  startTimer() {
    console.log('Starting rotation timer!');

    this.timer = setInterval(this.rotate.bind(this), this.interval);

    this.notify && notifier.notify({
      title: 'Wallpaper Shuffle',
      message: 'Started!'
    });
  }

  stopTimer() {
    clearInterval(this.timer);
    this.timer = 0;

    console.log('Rotation timer stopped.');

    this.notify && notifier.notify({
      title: 'Wallpaper Shuffle',
      message: 'Stopped!'
    });
  }

  toggleTimer() {
    console.log('Toggling rotation timer.');
    return (this.timer ? this.stopTimer() : this.startTimer());
  }

  rotate() {
    console.log('Rotating wallpaper!');
    return rotateWallpaper(this.pattern, this.notify);
  }

  announceRunning() {
    console.log('Telling master process that daemon is running.');
    process.send({ running: true });
  }
}

process.on('message', (params) => {
  instance = new Daemon(params);
  instance.startTimer();
  instance.rotate().then(instance.announceRunning);
});

process.on('SIGUSR1', () => {
  if (!instance) return;
  instance.toggleTimer();
});

process.on('SIGUSR2', () => {
  if (instance.pattern) {
    instance.rotate();
  }
});

process.on('SIGTERM', () => {
  instance.stopTimer();
  process.exit();
});

process.on('exit', () => {
  console.log('Daemon: Exiting!');
});
