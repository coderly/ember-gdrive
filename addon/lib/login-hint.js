import Cache from 'ember-gdrive/lib/local-cache';
import { extractQueryParams } from 'ember-gdrive/lib/uri';

function cacheLoginHint(documentId, userId) {
  var cache = new Cache('document_login_hint');
  cache.set(documentId, userId);
}

function fetchLoginHint() {
  var userId = extractQueryParams().userId;
  if (!userId) {
    var cache = new Cache('document_login_hint');
    userId = cache.get(_getDocumentIdFromLocation());
  }
  return userId;
}

function _getDocumentIdFromLocation() {
  return location.href.split('/d/')[1].split('/')[0];
}

export { cacheLoginHint, fetchLoginHint };
