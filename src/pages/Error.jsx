import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';

const styles = {
  container: {
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  wrapper: {
    maxWidth: '450px',
  },
  title: {
    fontSize: '1.5rem',
    marginTop: '15px',
    color: '#47494e',
    marginBottom: '8px',
  },
  desc: {
    color: '#7f828b',
    lineHeight: '21px',
    marginBottom: '10px',
  },
};

const Error = ({ statusCode, message }) => {
  const status = useMemo(() => statusCode || 500, [statusCode]);
  const msg = useMemo(() => message || 'An unexpected error has occurred', [message]);
  const title = useMemo(() => `${status}: ${msg}`, [status, message]);

  return (
    <div style={styles.container}>
      <Helmet>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0" />
      </Helmet>
      <div style={styles.wrapper}>
        <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="#dbe1ec" viewBox="0 0 48 48">
          <path d="M22 30h4v4h-4zm0-16h4v12h-4zm1.99-10C12.94 4 4 12.95 4 24s8.94 20 19.99 20S44 35.05 44 24 35.04 4 23.99 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z" />
        </svg>
        <div style={styles.title}>{status}</div>
        <div style={styles.desc}>{msg}</div>
      </div>
    </div>
  );
};

export default Error;
