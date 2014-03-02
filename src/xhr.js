
// ###getXhr
// While getting a new XMLHttpRequest is standardized now, we are still going 
// to provide this syntactic sugar to allow the setting of global headers (will
// be set on each request) as well as the onload, onerrer, onloadend, timeout and
// ontimeout properties and methods to be set with one call.
// Does not have a default for obj.url all others are:
//   {
//     verb: 'GET',
//     responseType: 'text',
//     url: mandatory,
//     params: optional,
//     onload: _.noop,
//     onerror: optional,
//     onloadend: optional,
//     timeout: optional,
//     ontimeout: optional,
//     user: optional,
//     password: optional
//   }
// If the verb is 'GET' and params is truthy it will be appended to the url as a 
// queryString (after being serialized if a hash -- assumed to be a string if not).
// This method does not call send() so do that once you have the xhr back, remember
// to set any pertinant MIME types if sending data via setRequestHeader (unless its 
// already in the $.xhrHeaders).
//
// `param` {object} `obj`. attributes for the XHR
// `returns` {object} the xhr object
$.getXhr = function getXhr(obj) {
  var xhr =  new XMLHttpRequest();
  obj.verb || (obj.verb = 'GET');
  // check if we need a QS
  if(obj.verb === 'GET' && obj.params) {
    // assumed to be an object literal if not a string
    if(typeof obj.params !== 'string') obj.params = $.serialize(obj.params);
    obj.url += ('?' + obj.params);
  }
  xhr.open(obj.verb, obj.url, true, obj.user, obj.password);
  xhr.responseType = obj.responseType || 'text';
  // so that some common use-case request headers can be set automagically, for blob, 
  // document, buffer and others handle manually after getting the xhr back.
  if(xhr.responseType === 'text') {
    // could be json or plain string TODO expand this to a hash lookup for other types later
    if(obj.contentType && obj.contentType === 'json') {
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
    } else {
      xhr.setRequestHeader('Accept', 'text/plain');
      xhr.setRequestHeader('Content-Type', 'text/plain');
    }
  }
  // set any custom headers
  Object.keys($.xhrHeaders).forEach(function(h) {xhr.setRequestHeader(h, $.xhrHeaders[h]);});
  // The native xhr considers many status codes a success that we do not, wrap the onload
  // so that we can call success or error based on code
  xhr.onload = function(e) {
    if(this.status >= 200 && this.status < 300 || this.status === 304) this._onload_(e);
    else this.onerror(e);
  };
  xhr._onload_ = obj.onload || $.noop;
  xhr.onerror = obj.onerror || $.noop;
  if(obj.onloadend) xhr.onloadend = obj.onloadend;
  if(obj.timeout) xhr.timeout = obj.timeout;
  if(obj.ontimeout) xhr.ontimeout = obj.ontimeout;
  return xhr;
};
// ###xhrHeaders
// Any 'global' headers that should go out with every XHR request 
$.xhrHeaders = {};