import encodeUrl from 'encodeurl';
import statuses from 'statuses';
import qs from 'qs';
import { setCharset, stringify } from './utils/common';

export default ({ ctx, assets, renderer }) => {
  const { req, res, pathname, query: ctxQueryStr, params: ctxParams } = ctx;
  const query = qs.parse(ctxQueryStr) || {};
  const params = ctxParams || {};

  // 头设置
  const header = {
    get(name) {
      if (!name) return null;

      return req.headers[name.toLowerCase()];
    },
    set(field, val) {
      res.setHeader(field, val);
    },
  };

  // 发送html
  const sendHtml = (html) => {
    // write strings in utf-8
    if (typeof html === 'string') {
      header.set('Content-Length', Buffer.byteLength(html));
    }

    if (req.method === 'HEAD') {
      // skip body for HEAD
      res.end();
    } else {
      // respond
      res.end(html, 'utf8');
    }
  };

  // 设置状态码
  const status = (code) => {
    res.statusCode = code;
  };

  // json返回
  const json = (o) => {
    header.set('Content-Type', setCharset('application/json', 'utf-8'));

    return sendHtml(stringify(o));
  };

  // jsonp返回
  const jsonp = (o, callback = 'callback') => {
    const body = stringify(o)
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
    // the typeof check is just to reduce client error noise
    const html = `/**/ typeof ${callback} === 'function' && ${callback}(${body});`;

    header.set('Content-Type', setCharset('application/json', 'utf-8'));

    return sendHtml(html);
  };

  // 地址跳转
  const location = (url) => {
    let loc = url;

    // "back" is an alias for the referrer
    if (url === 'back') {
      loc = header.get('Referrer') || '/';
    }

    // set location
    return header.set('Location', encodeUrl(loc));
  };

  // 重定向
  const redirect = (...args) => {
    const [url, statusCode] = args;
    let address = url;
    let statusCodeVal = 302;

    // allow status / url
    if (args.length === 2) {
      if (typeof url === 'number') {
        statusCodeVal = url;
        address = statusCode;
      } else {
        statusCodeVal = statusCode;
      }
    }

    status(statusCodeVal);
    location(address);

    res.end();
  };

  // 渲染
  const render = (props) => {
    // html
    const html = renderer.render(assets.name, props);

    header.set('Content-Type', setCharset('text/html', 'utf-8'));

    return sendHtml(html);
  };

  // 错误渲染
  const error = (props) => {
    const { statusCode, message, ...args } = props;
    const msg = message || statuses.message[statusCode];

    // html
    const html = renderer.render(assets.name, { statusCode, message: msg, ...args });

    header.set('Content-Type', setCharset('text/html', 'utf-8'));

    return sendHtml(html);
  };

  const result = {
    req,
    res,
    pathname,
    query,
    params,
    header,
    status,
    json,
    jsonp,
    location,
    redirect,
    render,
  };
  if (assets.name !== '_error') {
    result.error = error;
  }

  return result;
};
