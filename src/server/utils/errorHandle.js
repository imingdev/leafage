import statuses from 'statuses';

/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */
const getErrorStatusCode = (err) => {
  // check err.status
  if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
    return err.status;
  }

  // check err.statusCode
  if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode;
  }

  return undefined;
};

/**
 * Get status code from response.
 *
 * @param {OutgoingMessage} res
 * @return {number}
 * @private
 */
const getResponseStatusCode = (res) => {
  let status = res.statusCode;

  // default status code to 500 if outside valid range
  if (typeof status !== 'number' || status < 400 || status > 599) {
    status = 500;
  }

  return status;
};

/**
 * Get headers from Error object.
 *
 * @param {Error} err
 * @return {object}
 * @private
 */
const getErrorHeaders = (err) => {
  if (!err.headers || typeof err.headers !== 'object') {
    return undefined;
  }

  const headers = Object.create(null);
  const keys = Object.keys(err.headers);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    headers[key] = err.headers[key];
  }

  return headers;
};

/**
 * Determine if the response headers have been sent.
 *
 * @param {object} res
 * @returns {boolean}
 * @private
 */
const headersSent = (res) => (typeof res.headersSent !== 'boolean'
  // eslint-disable-next-line no-underscore-dangle
  ? Boolean(res._header)
  : res.headersSent);

export default (err, req, res) => {
  let headers = {};
  let message;
  let status;

  // ignore 404 on in-flight response
  if (!err && headersSent(res)) return;

  // unhandled error
  if (err) {
    // respect status code from error
    status = getErrorStatusCode(err);

    if (status === undefined) {
      // fallback to status code on response
      status = getResponseStatusCode(res);
    } else {
      // respect headers from error
      headers = getErrorHeaders(err);
    }

    // get error message
    message = statuses.message[status];
  } else {
    // not found
    status = 404;
    message = statuses.message[status];
  }

  // response status
  res.statusCode = status;

  // remove any content headers
  res.removeHeader('Content-Encoding');
  res.removeHeader('Content-Language');
  res.removeHeader('Content-Range');

  // response headers
  Object.keys(headers || {}).forEach((key) => {
    res.setHeader(key, headers[key]);
  });

  // security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return {
    statusCode: status,
    message,
  };
};
