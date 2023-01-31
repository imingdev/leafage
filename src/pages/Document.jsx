import React from 'react';
import devalue from 'devalue';
import { Helmet } from 'react-helmet';

const RenderJudge = ({ value, active, inactive }) => (value ? active : inactive);
const Script = ({ code }) => (
  // eslint-disable-next-line react/no-danger
  <script type="text/javascript" dangerouslySetInnerHTML={{ __html: code }} />
);
const genBaiduCode = (id) => {
  const code = `
    var _hmt = _hmt || [];
    (function() {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?${id}";
      document.head.appendChild(hm);
    })();
  `;
  return (
    <Script code={code} />
  );
};
const genGoogleCode = (id) => {
  const code = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  `;

  return (
    <>
      <Helmet>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      </Helmet>
      <Script code={code} />
    </>
  );
};
const genCustomCode = (code) => (
  <Script code={code} />
);
const genMap = {
  baidu: genBaiduCode,
  google: genGoogleCode,
  custom: genCustomCode,
};

const Document = ({ body, scripts, styles, props, helmet, context, id, statistic }) => (
  <html {...helmet.htmlAttributes.toComponent()}>
    <head>
      {helmet.base.toComponent()}
      {helmet.title.toComponent()}
      {helmet.meta.toComponent()}
      {helmet.link.toComponent()}
      {helmet.style.toComponent()}
      {helmet.noscript.toComponent()}
      {styles.map((href) => (<link href={href} key={href} rel="stylesheet" />))}
    </head>
    <body {...helmet.bodyAttributes.toComponent()}>
      {/* eslint-disable-next-line react/no-danger */}
      <div id={id} dangerouslySetInnerHTML={{ __html: body }} />
      <RenderJudge
        value={Object.keys(props || {})?.length}
        active={(
          <Script code={`${context}=${devalue(props)}`} />
        )}
      />
      {scripts.map((src) => (<script src={src} key={src} type="text/javascript" defer />))}
      {helmet.script.toComponent()}
      {Object.keys(statistic).map((key) => {
        const code = genMap[key]?.(statistic[key]);
        return (
          <RenderJudge
            value={code}
            active={code}
            key={key}
          />
        );
      })}
    </body>
  </html>
);

export default Document;
