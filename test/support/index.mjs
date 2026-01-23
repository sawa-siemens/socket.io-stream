import { io } from 'socket.io-client';
import ss from '../../index.js';

export const port = process.env.ZUUL_PORT || 4000;

const isBrowser = typeof window !== 'undefined';
const defaultURI = isBrowser ? '' : `http://localhost:${port}`;

export function client(uri, options) {
  if (typeof uri === 'object') {
    options = uri;
    uri = null;
  }
  uri = uri || defaultURI;
  options = options || {};

  const _options = {
    forceNew: true,
    ...options,
  };

  return io(uri, _options);
}

export { ss };
