#!/usr/bin/env node
/**
 * Wallpaper Shuffle
 * A daemon that randomly rotates wallpaper
 */

import _          from 'lodash';
import Q          from 'q';
import io         from 'q-io/fs';
import os         from 'os';
import path       from 'path';
import glob       from 'glob';
import pkg        from '../../package.json';
import chalk      from 'chalk';
import moment     from 'moment';
import prettyjson from 'prettyjson';
import child      from 'child_process';
import yargs      from 'yargs';

const argv = yargs
  .command('start', 'Begin rotating wallpapers')
  .command('stop', 'Stop rotating wallpapers')
  .command('status', 'Checks for a running wallpaper-shuffle process')
  .command('next', 'Manually switch to a new random wallpaper')
  .option('d', {
    description: 'Directory containing images',
    default: process.cwd(),
    alias: 'directory'
  })
  .option('i', {
    description: 'Transition interval (ex. "5 minutes", "1 hour")',
    default: '5 minutes',
    alias: 'interval'
  })
  .option('g', {
    description: 'Pattern of files to search for',
    default: '*.{png,jpg,jpeg}',
    alias: 'glob'
  })
  .option('p', {
    description: 'PID file',
    default: path.join(os.tmpdir(), 'wallpaper-shuffle.json'),
    alias: 'pid'
  })
  .option('n', {
    description: 'Enable desktop notifications',
    default: false,
    alias: 'notify'
  })
  .option('h', { alias: 'help' })
  .help('help')
  .option('v', { alias: 'version' })
  .version(pkg.version, 'version', 'Display version information')
  .example('$0 start -d ~/Photos/Wallpaper -i "30 minutes"')
  .argv;

const daemonScript = path.join(__dirname, '..', 'lib', 'daemon.js');

const logError        = (err) => console.error(err.message);
const isRunning       = () => io.exists(argv.pid);
const getProcessJSON  = () => io.read(argv.pid).then(JSON.parse);
const getPID          = () => getProcessJSON().then((json) => json.pid);
const countWallpapers = (pathGlob) => {
  let deferred = Q.defer();

  glob(pathGlob, (err, matches) => {
    if (err) {
      deferred.resolve(0);
    } else {
      deferred.resolve(matches.length);
    }
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
      let daemon = child.spawn(daemonScript, [], {
        env: process.env,
        stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
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
