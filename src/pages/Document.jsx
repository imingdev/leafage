import React from 'react';
import devalue from 'devalue';

const RenderJudge = ({ value, active, inactive }) => (value ? active : inactive);

const Document = ({ body, scripts, styles, props, helmet, context, id }) => (
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
        value={props}
        active={(
          // eslint-disable-next-line react/no-danger
          <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `${context}=${devalue(props)}` }} />
        )}
      />
      {scripts.map((src) => (<script src={src} key={src} type="text/javascript" defer />))}
      {helmet.script.toComponent()}
    </body>
  </html>
);

export default Document;
