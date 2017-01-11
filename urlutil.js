module.exports = (function () {
// urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
//  rooturl + '/' + encodePathSegment(p1) + '/' + encodePathSegment(p2) 
//	+ '?' + encodeQuerySegment(a) + '=' + encodeQuerySegment(b) 
//	+ '&' + encodeQuerySegment(c) + '=' + encodeQuerySegment(d)
var urlutil = {};


urlutil.encode_utf8 = function encode_utf8(s) {
	return unescape(encodeURIComponent(s));
};


/**
 * encode a path segment of a URL
 * See RFC 2396, section 3.3
 *
 * @return encoded path segment
 */
urlutil.encodePathSegment = function encodePathSegment(s) {
	if (null == s) {
		return "";
	}

	var sb = "";
	var pathUnreserved = ":@&=+$,";

	var utf8 = urlutil.encode_utf8(s);
	var len = utf8.length;
	for (var i = 0; i < len; ++i) {
		var c = utf8[i];
		if (urlutil.isUnReservedRFC2396(c)) {
			sb += c;
		}
		else if (-1 != pathUnreserved.indexOf(c)) {
			sb += c;
		}
		else {
			sb += urlutil.escapeRFC3986(c);
		}
	}

	return sb;
};

/**
 * use to encode the query parameter name and the value separately.
 * encode('filter') + '=' encode(value)
 *
 * @param s
 * @return
 */
urlutil.encodeQuerySegment = function encodeQuerySegment(s) {
	if (null == s) {
		return "";
	}

	var sb = "";

	var utf8 = urlutil.encode_utf8(s);
	var len = utf8.length;
	for (var i = 0; i < len; ++i) {
		var c = utf8[i];
		if (urlutil.isPchar3896(c) || '/' == c || '?' == c) {
			sb += c;
		}
		else {
			sb += urlutil.escapeRFC3986(c);
		}
	}
	return sb;
};

urlutil.isLowerAlphaRFC2396 = function isLowerAlphaRFC2396(c) {
	return -1 != "abcdefghijklmnopqrstuvwxyz".indexOf(c);
};

urlutil.isUpperAlphaRFC2396 = function isUpperAlphaRFC2396(c) {
	return -1 != "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
};

urlutil.isAlphaRFC2396 = function isAlphaRFC2396(c) {
	return urlutil.isLowerAlphaRFC2396(c) || urlutil.isUpperAlphaRFC2396(c);
};

urlutil.isDigitRFC2396 = function isDigitRFC2396(c) {
	return -1 != "0123456789".indexOf(c);
};

urlutil.isAlphaNumRFC2396 = function isAlphaNumRFC2396(c) {
	return urlutil.isAlphaRFC2396(c) || urlutil.isDigitRFC2396(c);
};

urlutil.isReservedRFC2396 = function isReservedRFC2396(c) {
	return -1 != ";/?:@&=+$,".indexOf(c);
};

urlutil.isMarkRFC2386 = function isMarkRFC2386(c) {
	return -1 != "-_.!~*'()".indexOf(c);
};

urlutil.isMarkRFC3896 = function isMarkRFC3896(c) {
	return -1 != "-_.!~".indexOf(c);
};

urlutil.isPchar3896 = function isPchar3896(c) {
	return urlutil.isUnReservedRFC3896(c) || urlutil.isSubDelim3896(c) || ':' == c || '@' == c;
}

urlutil.isSubDelim3896 = function isSubDelim3896(c) {
	return -1 != "!$&'()*+,;=".indexOf(c);
};

urlutil.isUnReservedRFC3896 = function isUnReservedRFC3896(c) {
	return urlutil.isAlphaNumRFC2396(c) || urlutil.isMarkRFC3896(c);
};

urlutil.isUnReservedRFC2396 = function isUnReservedRFC2396(c) {
	return urlutil.isAlphaNumRFC2396(c) || urlutil.isMarkRFC2386(c);
};

urlutil.HEX_DIGITS = "0123456789ABCDEF";

/**
 * RFC 2396 was obsoleted by RFC3986
 * essentially adds UTF-8
 */
urlutil.escapeRFC3986 = function escapeRFC3986(c) {
	var v = c.charCodeAt(0);
	if (v > 255) {
		throw new RuntimeException("Cannot encode outside of range US-ASCII(utf8 encoded)");
	}
	var d1 = Math.floor(v / 16);
	var d2 = Math.floor(v % 16);
	return "%" + urlutil.HEX_DIGITS[d1] + urlutil.HEX_DIGITS[d2];
};

return urlutil;
})();