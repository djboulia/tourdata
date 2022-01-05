//
// Store a bunch of common headers that are useful
// for some web sites that depend on them
//

var buildUserAgent = function(ua) {
  const obj = {};
  obj['User-Agent'] = ua;
  return obj;
};

var getXmlHttpRequest = function() {
  const obj = {};
  obj['X-Requested-With'] = "XMLHttpRequest";
  return obj;
};

var Header = {
  UserAgent :  {
    FIREFOX : buildUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:81.0) Gecko/20100101 Firefox/81.0"),
    IPHONE: buildUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1"),
    IPAD: buildUserAgent("Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G36"),
    SAFARI : buildUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15")
  },

  XmlHttpRequest: getXmlHttpRequest()
};

module.exports = Header;