import path  from 'path';
import os    from 'os';
import yargs from 'yargs';
import pkg   from '../../package.json';

export const argv = yargs
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
  .option('l', {
    description: 'Daemon logfile',
    default: null,
    alias: 'log'
  })
  .option('h', { alias: 'help' })
  .help('help')
  .option('v', { alias: 'version' })
  .version(pkg.version, 'version', 'Display version information')
  .example('$0 start -d ~/Photos/Wallpaper -i "30 minutes"')
  .argv;
