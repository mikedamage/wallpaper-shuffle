#!/usr/bin/env node
/**
 * Wallpaper Shuffle
 * A daemon that randomly rotates wallpaper
 */

import _          from 'lodash';
import Q          from 'q';
import io         from 'q-io/fs';
import path       from 'path';
import glob       from 'glob';
import chalk      from 'chalk';
import moment     from 'moment';
import prettyjson from 'prettyjson';
import child      from 'child_process';
import fs         from 'fs';
import { argv }   from '../lib/cli-flags';

const daemonScript = path.join(__dirname, '..', 'lib', 'daemon.js');

const logError        = (err) => console.error(err.message);
const isRunning       = () => io.exists(argv.pid);
const getProcessJSON  = () => io.read(argv.pid).then(JSON.parse);
const getPID          = () => getProcessJSON().then((json) => json.pid);
const countWallpapers = (pathGlob) => {
  let deferred = Q.defer();

  glob(pathGlob, (err, matches) => {
    if (err) return deferred.resolve(0);
    deferred.resolve(matches.length);
  });

  return deferred.promise;
};

const parseTime = (time) => {
  let split     = time.split(' ');
  let timeNum   = parseFloat(split[0]);
  let timeUnits = split.slice(1).join(' ');
  let interval  = moment.duration(timeNum, timeUnits);
  return interval.asMilliseconds();
}

const getPIDIfRunning = (exists) => {
  if (!exists) {
    console.log(chalk.bold.red('not running'));
    process.exit(1);
  }

  return getPID();
};

const actions = {
  start() {
    let milliseconds = parseTime(argv.interval);
    let pathGlob = path.join(argv.directory, argv.glob);

    return isRunning().then((running) => {
      if (running) {
        console.log(chalk.yellow.bold('Already running!'));
        process.exit();
      }
    }, logError)
    .then(() => countWallpapers(pathGlob), logError)
    .then((count) => {
      if (!count) {
        throw new Error('No wallpapers found!');
      }
    }, logError)
    .then(() => {

      let out = argv.log ? fs.openSync(argv.log, 'a') : 'ignore';
      let err = argv.log ? fs.openSync(argv.log, 'a') : 'ignore';
      let daemon = child.spawn(daemonScript, [], {
        env: process.env,
        stdio: [ 'ignore', out, err, 'ipc' ],
        detached: true
      });

      let processInfo = {
        pathGlob,
        pid: daemon.pid,
        interval: {
          raw: argv.interval,
          milliseconds: milliseconds
        }
      };

      return io.write(argv.pid, JSON.stringify(processInfo)).then((pid) => daemon);
    }, logError)
    .then((daemon) => {
      daemon.on('message', (status) => {
        if (status.running) {
          console.log(prettyjson.render({ status: 'running', pid: daemon.pid }));
          process.exit(0);
        }

        console.log(chalk.bold.red('error starting daemon'));
        process.exit(1);
      });

      daemon.send({ pattern: pathGlob, interval: milliseconds, notify: argv.notify });
      daemon.unref();
    }, logError);
  },

  stop() {
    return isRunning()
      .then((exists) => {
        if (!exists) {
          console.log(chalk.bold.red('not running'));
          process.exit(1);
        }

        return getPID();
      }, logError)
      .then((pid) => {
        process.kill(pid, 'SIGTERM');
        return io.remove(argv.pid);
      }, logError)
      .then(() => {
        console.log(chalk.magenta.bold('stopped'));
        process.exit(0);
      }, logError);
  },

  pause() {
    return isRunning()
      .then((exists) => {
        if (!exists) {
          console.log(chalk.bold.red('not running'));
          process.exit(1);
        }

        return getPID();
      })
      .then((pid) => {
        process.kill(pid, 'SIGUSR1');
        console.log(chalk.bold.green('play/pause'));
        process.exit();
      });
  },

  next() {
    return isRunning()
      .then((exists) => {
        if (!exists) {
          console.log(chalk.bold.red('not running'));
          process.exit(1);
        }

        return getPID();
      })
      .then((pid) => {
        process.kill(pid, 'SIGUSR2');
        console.log(chalk.bold.green('changing wallpaper'));
        process.exit(0);
      });
  },

  status() {
    return isRunning()
      .then((exists) => {
        if (exists) {
          return getProcessJSON();
        }
        let json = { status: 'not running' };
        console.log(prettyjson.render(json));
        process.exit();
      })
      .then((json) => {
        json.status = 'running';
        console.log(prettyjson.render(json));
      }, (err) => console.log(chalk.bold.red(err.message)))
      .done(() => process.exit());
  }

};

if (argv._.length === 0) {
  console.log(chalk.bold.red('Please give me a command!'));
  process.exit(1);
}

var command = argv._[0];

if (!actions.hasOwnProperty(command)) {
  console.log(chalk.red.bold('invalid command!'));
  process.exit(1);
}

actions[command]();
