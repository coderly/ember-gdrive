import Cache from 'ember-gdrive/lib/local-cache';

function cacheLoginHint(documentId, userId) {
  var cache = new Cache('document_login_hint');
  cache.set(documentId, userId);
}

function fetchLoginHint() {
  var userId = _extractQueryParams().userId;
  if (!userId) {
    var cache = new Cache('document_login_hint');
    userId = cache.get(_getDocumentIdFromLocation());
  }
  return userId;
}

function _extractQueryParams() {
  var params = {};
  location.search.substr(1).split('&').forEach(function (item) {
    params[item.split('=')[0]] = decodeURIComponent(item.split('=')[1]);
  });
  return params.state ? JSON.parse(params.state) : {};
}

function _getDocumentIdFromLocation() {
  return location.href.split('/d/')[1].split('/')[0];
}

export default { cacheLoginHint, fetchLoginHint };
