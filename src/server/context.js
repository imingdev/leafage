import statuses from 'statuses';

export default ({ ctx, assets, renderer }) => {
  const { req, res } = ctx;

  // 渲染
  const render = (props) => {
    // html
    const html = renderer.render(assets.name, props);

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
