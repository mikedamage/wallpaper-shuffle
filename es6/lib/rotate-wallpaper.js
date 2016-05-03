import _         from 'lodash';
import Q         from 'q';
import path      from 'path';
import glob      from 'glob';
import wallpaper from 'wallpaper';
import Random    from 'random-js';
import notifier  from 'node-notifier';

const engine = Random.engines.nativeMath;

export function rotateWallpaper(pattern, notify = false) {
  let deferred = Q.defer();

  glob(pattern, (err, matches) => {
    if (err) return deferred.reject(err);
    let image = Random.pick(engine, matches);
    wallpaper.set(image);
    deferred.resolve(image);
  });

  return deferred.promise;
};
