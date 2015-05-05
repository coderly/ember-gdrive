function extractQueryParams() {
  var params = {};
  location.search.substr(1).split('&').forEach(function(item) {
    params[item.split('=')[0]] = decodeURIComponent(item.split('=')[1]);
  });
  return params;
};

function clearQueryString() {
  var uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    var cleanUri = uri.substring(0, uri.indexOf('?'));
    window.history.replaceState({}, document.title, cleanUri);
  }
};

function getDocumentIdFromLocation() {
  return location.href.split('/d/')[1].split('/')[0];
}

export { extractQueryParams, clearQueryString, getDocumentIdFromLocation };