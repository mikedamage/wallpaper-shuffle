/* jshint node: true */

var HistoryQueue = function HistoryQueue(quota) {
  this.quota    = quota;
  this._storage = [];
};

HistoryQueue.prototype.add = function(val) {
  this._storage.unshift(val);
  this._trim();
  return val;
};

HistoryQueue.prototype.get = function(index) {
  return this._storage[index];
};

HistoryQueue.prototype.set = function(index, val) {
  this._storage[index] = val;
  return val;
}

HistoryQueue.prototype._trim = function() {
  if (this._storage.length > this.quota) {
    this._storage.splice(this.quota, this._storage.length - this.quota);
  }
};

module.exports = HistoryQueue;
