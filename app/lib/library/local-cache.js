var LocalCache = function(namespace) {
  this.namespace = namespace;
};
LocalCache.prototype.get = function(id) {
  return localStorage.getItem(this.namespace + ':' + id);
};
LocalCache.prototype.set = function(id, value) {
  localStorage.setItem(this.namespace + ':' + id, value);
};
export default LocalCache;