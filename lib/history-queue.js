/* jshint node: true */

var HistoryQueue = function HistoryQueue(quota) {
  this.quota    = quota;
  this._storage = [];
};

HistoryQueue.prototype.push = function(val) {
  this._storage.push(val);
  this._trim();
}

HistoryQueue.prototype.pop = function() {
  return this._storage.pop();
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
    this._storage.splice(0, this._storage.length - this.quota);
  }
};

module.exports = HistoryQueue;
