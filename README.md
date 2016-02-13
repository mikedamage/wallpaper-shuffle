# Wallpaper Shuffle

by Mike Green

## Summary

`wallpaper-shuffle` is a Node daemon that randomly rotates desktop wallpaper at a user specified interval.

## Installaton

__Via NPM:__
```bash
npm install -g wallpaper-shuffle
```

__Via Git:__
```bash
git clone https://github.com/mikedamage/wallpaper-shuffle.git
cd wallpaper-shuffle
npm install
npm link
```

## Usage

```
Commands:
  start   Begin rotating wallpapers
  stop    Stop rotating wallpapers
  status  Checks for a running wallpaper-shuffle process
  next    Manually switch to a new random wallpaper

Options:
  -d, --directory  Directory containing images
                 [default: $PWD]
  -i, --interval   Transition interval (ex. "5 minutes", "1 hour")
                                                          [default: "5 minutes"]
  -g, --glob       Pattern of files to search for  [default: "*.{png,jpg,jpeg}"]
  -p, --pid        PID file                                            [default:
      "$TMPDIR/wallpaper-shuffle.json"]
  -n, --notify     Enable desktop notifications                 [default: false]
  -h, --help       Show help                                           [boolean]
  -v, --version    Display version information                         [boolean]

Examples:
  wallpaper-shuffle start -d
  ~/Photos/Wallpaper -i "30 minutes"
```
