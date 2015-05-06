/* jshint node: true */

'use strict';

var path      = require('path');
var glob      = require('glob');
var wallpaper = require('wallpaper');
var Random    = require('random-js');
var engine    = Random.engines.nativeMath;

module.exports = function rotateWallpaper(pattern) {
  var wallpapers = glob.sync(pattern);
  var image      = Random.pick(engine, wallpapers);

  wallpaper.set(image);
  return image;
};
