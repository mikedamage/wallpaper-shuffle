/* jshint node: true */

'use strict';

var Q         = require('q');
var path      = require('path');
var glob      = require('glob');
var wallpaper = require('wallpaper');
var Random    = require('random-js');
var engine    = Random.engines.nativeMath;

module.exports = function rotateWallpaper(pattern) {
  var deferred   = Q.defer();

  glob(pattern, function(err, matches) {
    if (err) {
      return deferred.reject(err);
    }

    var image = Random.pick(engine, matches);
    wallpaper.set(image);
    deferred.resolve(image);
  });

  return deferred;
};
