#!/usr/bin/env node
/**
 * Wallpaper Shuffle
 * A daemon that randomly rotates wallpaper
 */

/* jshint node: true */

'use strict';

var _       = require('lodash');
var io      = require('q-io');
//var fs      = require('fs');
var os      = require('os');
var path    = require('path');
var glob    = require('glob');
var pkg     = require(path.join(__dirname, '..', 'package.json'));
var chalk   = require('chalk');
var moment  = require('moment');
var child   = require('child_process');
var argv    = require('yargs')
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
    default: path.join(os.tmpdir(), 'wallpaper-shuffle.pid'),
    alias: 'pid'
  })
  .option('h', { alias: 'help' })
  .help('help')
  .option('v', { alias: 'version' })
  .version(pkg.version, 'version', 'Display version information')
  .example('$0 start -d ~/Photos/Wallpaper -i "30 minutes"')
  .argv;

var daemonScript = path.join(__dirname, '..', 'lib', 'daemon.js');

var isRunning = function() {
  return io.exists(argv.pid);
};

var getPID = function() {
  return io.read(argv.pid);
}

var actions = {
  start: function() {
    var timeSplit    = argv.interval.split(' ');
    var timeNum      = parseFloat(timeSplit[0]);
    var timeUnits    = timeSplit.slice(1).join(' ');
    var interval     = moment.duration(timeNum, timeUnits);
    var milliseconds = interval.asMilliseconds();
    var pathGlob     = path.join(argv.directory, argv.glob);

    if (_.isEmpty(glob.sync(pathGlob))) {
      console.log(chalk.bold.red('No wallpapers found: ') + argv.directory);
      process.exit(1);
    }

    var daemon = child.spawn(daemonScript, [], {
      env: process.env,
      stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
      detached: true
    });

    fs.writeFileSync(argv.pid, String(daemon.pid));

    daemon.on('message', function(status) {
      if (status.running) {
        console.log(chalk.green.bold('running ') + '(pid: %d)', daemon.pid);
        process.exit(0);
      }
      console.log(chalk.red.bold('error starting daemon'));
      process.exit(1);
    });

    daemon.send({ pattern: pathGlob, interval: milliseconds });
    daemon.unref();
  },
  stop: function() {
    return isRunning().then(function(exists) {
      if (exists) {
        console.log(chalk.bold.red('not running'));
        process.exit(1);
      }

      process.kill(getPID(), 'SIGTERM');
      return io.remove(argv.pid);
    }).then(function() {
      console.log(chalk.magenta.bold('stopped'));
      process.exit(0);
    });
  },
  pause: function() {
    if (!isRunning()) {
      console.log(chalk.bold.red('not running'));
      process.exit(1);
    }
    process.kill(getPID(), 'SIGINT');
    console.log(chalk.bold.green('play/pause'));
    process.exit();
  },
  next: function() {
    if (!isRunning()) {
      console.log(chalk.red.bold('not running'));
      process.exit(1);
    }
    process.kill(getPID(), 'SIGUSR2');
    console.log(chalk.bold('changing wallpaper'));
    process.exit();
  },
  status: function() {
    if (isRunning()) {
      console.log(chalk.green.bold('running ') + '(pid: %d)', getPID());
    } else {
      console.log(chalk.red.bold('not running'));
    }
    process.exit();
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

actions[command].call(this);
