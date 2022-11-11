import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.5,
    fontFamily: '-apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", "Fira Sans", Avenir, "Helvetica Neue", "Lucida Grande", sans-serif',
    background: '#f7fafc',
  },
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '0.05em',
    fontSize: '1.125rem',
    color: '#a0aec0',
  },
  title: {
    padding: '0 1rem',
    borderRight: '1px solid #cbd5e0',
  },
  desc: {
    padding: '0 1rem',
    textTransform: 'uppercase',
  },
};

const Error = ({ statusCode, message }) => {
  const status = useMemo(() => statusCode || 500, [statusCode]);
  const msg = useMemo(() => message || 'An unexpected error has occurred', [message]);
  const title = useMemo(() => `${status} ${msg}`, [status, message]);

  return (
    <div style={styles.container}>
      <Helmet>
        <title>{title}</title>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"
        />
      </Helmet>
      <div style={styles.wrapper}>
        <div style={styles.title}>{status}</div>
        <div style={styles.desc}>{msg}</div>
      </div>
    </div>
  );
};

export default Error;
