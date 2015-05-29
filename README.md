# Wallpaper Shuffle

by Mike Green

## Summary

`wallpaper-shuffle` is a Node daemon that randomly rotates desktop wallpaper at a user specified interval.

## Usage

```
Commands:
  start   Begin rotating wallpapers
  stop    Stop rotating wallpapers
  status  Checks for a running wallpaper-shuffle process
  next    Manually switch to a new random wallpaper

Options:
  -d, --directory  Directory containing images
          [default: "/media/mike/bucket/development/projects/wallpaper-shuffle"]
  -i, --interval   Transition interval (ex. "5 minutes", "1 hour")
                                                          [default: "5 minutes"]
  -g, --glob       Pattern of files to search for  [default: "*.{png,jpg,jpeg}"]
  -p, --pid        PID file         [default: "/tmp/mike/wallpaper-shuffle.pid"]
  -h, --help       Show help
  -v, --version    Display version information

Examples:
  wallpaper-shuffle start -d ~/Photos/Wallpaper -i "30 minutes"
```