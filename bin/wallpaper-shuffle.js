#!/usr/bin/env node
/**
 * Wallpaper Shuffle
 * A daemon that randomly rotates wallpaper
 */

/* jshint node: true */

'use strict';

var _       = require('lodash');
var Q       = require('q');
var io      = require('q-io/fs');
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
  return io.read(argv.pid).then(function(pid) {
    return parseInt(pid, 10);
  });
};

var countWallpapers = function(pathGlob) {
  var deferred = Q.defer();

  glob(pathGlob, function(err, matches) {
    if (err) {
      deferred.resolve(0);
    } else {
      deferred.resolve(matches.length);
    }
  });

  return deferred.promise;
};

var actions = {

  start: function() {
    var timeSplit    = argv.interval.split(' ');
    var timeNum      = parseFloat(timeSplit[0]);
    var timeUnits    = timeSplit.slice(1).join(' ');
    var interval     = moment.duration(timeNum, timeUnits);
    var milliseconds = interval.asMilliseconds();
    var pathGlob     = path.join(argv.directory, argv.glob);

    return countWallpapers(pathGlob).then(function(count) {
      if (!count) {
        throw new Error('No wallpapers found!');
      }
    }).then(function() {
      var daemon = child.spawn(daemonScript, [], {
        env: process.env,
        stdio: [ 'ignore', 'ignore', 'ignore', 'ipc' ],
        detached: true
      });

      return io.write(argv.pid, String(daemon.pid)).then(function(pid) {
        return daemon;
      });
    }, function(err) {
      console.log(chalk.bold.red(err.message));
      process.exit(1);
    }).then(function(daemon) {
      daemon.on('message', function(status) {
        if (status.running) {
          console.log(chalk.bold.green('running ') + '(pid: %s)', daemon.pid);
          process.exit(0);
        }

        console.log(chalk.bold.red('error starting daemon'));
        process.exit(1);
      });

      daemon.send({ pattern: pathGlob, interval: milliseconds });
      daemon.unref();
    });
  },

  stop: function() {
    return isRunning().then(function(exists) {
      if (!exists) {
        console.log(chalk.bold.red('not running'));
        process.exit(1);
      }

      return getPID();
    }).then(function(pid) {
      process.kill(pid, 'SIGTERM');
      return io.remove(argv.pid);
    }).then(function() {
      console.log(chalk.magenta.bold('stopped'));
      process.exit(0);
    });
  },

  pause: function() {
    return isRunning().then(function(exists) {
      if (!exists) {
        console.log(chalk.bold.red('not running'));
        process.exit(1);
      }

      return getPID();
    }).then(function(pid) {
      process.kill(pid, 'SIGUSR1');
      console.log(chalk.bold.green('play/pause'));
      process.exit();
    });
  },

  next: function() {
    return isRunning().then(function(exists) {
      if (!exists) {
        console.log(chalk.bold.red('not running'));
        process.exit(1);
      }

      return getPID();
    }).then(function(pid) {
      process.kill(pid, 'SIGUSR2');
      console.log(chalk.bold.green('changing wallpaper'));
      process.exit(0);
    });
  },

  status: function() {
    return isRunning().then(function(exists) {
      if (exists) {
        return getPID();
      }
      throw new Error('not running');
    }).then(function(pid) {
      console.log(chalk.bold.green('running ') + '(pid %d)', pid);
    }, function(err) {
      console.log(chalk.bold.red(err.message));
    }).done(function() { process.exit(); });
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
