#!/usr/bin/env node
/**
 * Wallpaper Shuffle
 * A daemon that randomly rotates wallpaper
 */

/* jshint node: true */

'use strict';

var _       = require('lodash');
var fs      = require('fs');
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
  .option('d', {
    description: 'Directory containing images',
    default: process.cwd(),
    alias: 'directory'
  })
  .option('i', {
    description: 'Transition interval (ex. 15M, 100S)',
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
  .argv;

var daemonScript = path.join(__dirname, '..', 'lib', 'daemon.js');

var isRunning = function() {
  return fs.existsSync(argv.pid);
};

var getPID = function() {
  return fs.readFileSync(argv.pid);
}

if (argv._.length === 0) {
  console.log(chalk.bold.red('Please give me a command!'));
  process.exit(1);
}

var command = argv._[0];

if (command === 'stop') {
  if (!isRunning()) {
    console.log(chalk.red.bold('not running'));
    process.exit(1);
  }

  process.kill(getPID(), 'SIGINT');
  fs.unlinkSync(argv.pid);

  console.log(chalk.bold.magenta('stopped'));
  process.exit();
}

if (command === 'status') {
  if (isRunning()) {
    console.log(chalk.green.bold('running ') + '(pid: ' + getPID() + ')');
  } else {
    console.log(chalk.red.bold('not running'));
  }

  process.exit();
}

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

var daemon = child.spawn(daemonScript, [
  pathGlob,
  milliseconds
]);

fs.writeFile(argv.pid, daemon.pid, function(err) {
  if (err) throw err;
  console.log(chalk.green.bold('started'));
  process.exit();
});
