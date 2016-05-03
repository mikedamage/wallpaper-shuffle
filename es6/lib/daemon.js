#!/usr/bin/env node

import rotate   from './rotate-wallpaper';
import notifier from 'node-notifier';

let instance;

class Daemon {
  constructor(params) {
    this.pattern  = params.pattern;
    this.interval = params.interval;
    this.notify   = !!params.notify || false;
  }

  startTimer() {
    this.timer = setInterval(this.rotate.bind(this), this.interval);

    this.notify && notifier.notify({
      title: 'Wallpaper Shuffle',
      message: 'Started!'
    });
  }

  stopTimer() {
    clearInterval(this.timer);
    this.timer = 0;

    this.notify && notifier.notify({
      title: 'Wallpaper Shuffle',
      message: 'Stopped!'
    });
  }

  toggleTimer() {
    return (this.timer ? this.stopTimer() : this.startTimer());
  }

  rotate() {
    rotate(this.pattern, this.notify);
  }
}

process.on('message', (params) => {
  instance = new Daemon(params);
  instance.startTimer();
  instance.rotate().then(() => process.send({ running: true }));
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
