/* jshint node: true */

'use strict';

var _         = require('lodash');
var Q         = require('q');
var path      = require('path');
var glob      = require('glob');
var wallpaper = require('wallpaper');
var Random    = require('random-js');
var notifier  = require('node-notifier');
var engine    = Random.engines.nativeMath;

module.exports = function rotateWallpaper(pattern, notify) {
  notify = _.isBoolean(notify) ? notify : false;

  var deferred   = Q.defer();

  glob(pattern, function(err, matches) {
    if (err) {
      return deferred.reject(err);
    }

    var image = Random.pick(engine, matches);
    wallpaper.set(image);

    if (notify) {
      notifier.notify({
        title: 'Wallpaper Shuffle',
        message: 'Changing wallpaper!'
      });
    }

    deferred.resolve(image);
  });

  return deferred.promise;
};
