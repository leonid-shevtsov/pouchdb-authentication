import { AuthError, getBaseUrl, getBasicAuthHeaders, getConfigUrl, fetchJSON, toCallback } from './utils';

import { assign } from 'pouchdb-utils';

export default function makeAdminsAPI(fetchFun) {

var getMembership = toCallback(function (opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }

  var url = getBaseUrl(db) + '/_membership';
  var ajaxOpts = assign({
    method: 'GET',
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  return fetchJSON(fetchFun, url, ajaxOpts);
});

var getNodeName = function (db, opts) {
  return db.getMembership(opts).then(
    membership => {
      // Some couchdb-2.x-like server
      return membership.all_nodes[0];
    },
    error => {
      if (error.error !== 'illegal_database_name') {
        throw error;
      } else {
        // Some couchdb-1.x-like server
        return undefined;
      }
    }
  );
};

var signUpAdmin = toCallback(function (username, password, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  } else if (!password) {
    return Promise.reject(new AuthError('You must provide a password'));
  }

  return getNodeName(db, opts).then(nodeName => {
    var configUrl = getConfigUrl(db, nodeName);
    var url = (opts.configUrl || configUrl) + '/admins/' + encodeURIComponent(username);
    var ajaxOpts = assign({
      method: 'PUT',
      headers: getBasicAuthHeaders(db),
      body: password,
    }, opts.ajax || {});
    return fetchJSON(fetchFun, url, ajaxOpts);
  });
});

var deleteAdmin = toCallback(function (username, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return getNodeName(db, opts).then(nodeName => {
    var configUrl = getConfigUrl(db, nodeName);
    var url = (opts.configUrl || configUrl) + '/admins/' + encodeURIComponent(username);
    var ajaxOpts = assign({
      method: 'DELETE',
      processData: false,
      headers: getBasicAuthHeaders(db),
    }, opts.ajax || {});
    return fetchJSON(fetchFun, url, ajaxOpts);
  });
});

return { getMembership, deleteAdmin, signUpAdmin };

}
