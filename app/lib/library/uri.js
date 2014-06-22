var extractQueryParams = function() {
  var params = {};
  location.search.substr(1).split("&").forEach(function(item) {
    params[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
  });
  return params;
};

var clearQueryString = function() {
  var uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    var cleanUri = uri.substring(0, uri.indexOf('?'));
    window.history.replaceState({}, document.title, cleanUri);
  }
};

export { extractQueryParams, clearQueryString };