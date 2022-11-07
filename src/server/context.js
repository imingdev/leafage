import statuses from 'statuses';
import errorHandle from './utils/errorHandle';

export default ({ ctx, assets, renderer }) => {
  const { req, res, err } = ctx;

  // 渲染
  const render = (props) => {
    let propsValue = props;
    if (err) {
      const { statusCode, message } = errorHandle(err, req, res);
      propsValue = { statusCode, message, ...props || {} };
    }
    // html
    const html = renderer.render(assets.name, propsValue);

    res.send(html);
  };

  // 错误渲染
  const error = (props) => {
    const { statusCode, message, ...args } = props;
    const msg = message || statuses.message[statusCode];

    // html
    const html = renderer.render(assets.name, { statusCode, message: msg, ...args });

    res.send(html);
  };

  const result = {
    req,
    res,
    render,
  };
  if (assets.name !== '_error') {
    result.error = error;
  }

  return result;
};
