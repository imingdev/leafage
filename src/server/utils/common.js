import contentType from 'content-type';

/**
 * @param {*} value
 * @param {function} replacer
 * @param {number} spaces
 * @param {boolean} escape
 * @returns {string}
 */
export const stringify = (value, replacer, spaces, escape) => {
  if (!value) return '';
  // v8 checks arguments.length for optimizing simple call
  // https://bugs.chromium.org/p/v8/issues/detail?id=4730
  let json = replacer || spaces ? JSON.stringify(value, replacer, spaces) : JSON.stringify(value);

  if (escape && typeof json === 'string') {
    json = json.replace(/[<>&]/g, (c) => {
      switch (c.charCodeAt(0)) {
        case 0x3c:
          return '\\u003c';
        case 0x3e:
          return '\\u003e';
        case 0x26:
          return '\\u0026';
        /* istanbul ignore next: unreachable default */
        default:
          return c;
      }
    });
  }

  return json;
};

/**
 * Set the charset in a given Content-Type string.
 *
 * @param {String} type
 * @param {String} charset
 * @return {String}
 * @api private
 */

export const setCharset = (type, charset) => {
  if (!type || !charset) {
    return type;
  }

  // parse type
  const parsed = contentType.parse(type);

  // set charset
  parsed.parameters.charset = charset;

  // format type
  return contentType.format(parsed);
};
