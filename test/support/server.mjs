import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { Checksum } from './checksum.mjs';
import ss from '../../index.js';
import { port } from './index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = new Server(port);

server.on('connection', (socket) => {
  ss(socket).on('read', (stream, path, callback) => {
    const file = fs.createReadStream(join(__dirname, '../../', path));
    const checksum = new Checksum();
    file.pipe(checksum).pipe(stream).on('finish', () => {
      callback(checksum.digest());
    });
  });

  ss(socket).on('checksum', (stream, callback) => {
    const checksum = new Checksum();
    stream.pipe(checksum).on('finish', () => {
      callback(checksum.digest());
    }).resume();
  });

  ss(socket).on('echo', (...args) => {
    const s = ss(socket);
    s.emit('echo', ...echo(args));
  });

  ss(socket).on('sendBack', (...args) => {
    sendBack(args);
  });

  ss(socket).on('multi', (stream1, stream2) => {
    stream1.pipe(stream2);
  });

  ss(socket).on('ack', (...args) => {
    const callback = args.pop();
    callback(...echo(args));
  });

  ss(socket).on('clientError', (stream, callback) => {
    stream.on('error', (err) => {
      callback(err.message);
    });
  });

  ss(socket).on('serverError', (stream, msg) => {
    stream.emit('error', new Error(msg));
  });
});

function echo(v) {
  if (v instanceof ss.IOStream) {
    return v.pipe(ss.createStream(v.options));
  }

  if (Array.isArray(v)) {
    return v.map((item) => echo(item));
  } else if (v && typeof v === 'object') {
    for (const k in v) {
      if (Object.hasOwn(v, k)) {
        v[k] = echo(v[k]);
      }
    }
  }
  return v;
}

function sendBack(v) {
  if (v instanceof ss.IOStream) {
    return v.pipe(v);
  }

  if (Array.isArray(v)) {
    v.forEach(sendBack);
  } else if (v && typeof v === 'object') {
    for (const k in v) {
      if (Object.hasOwn(v, k)) {
        sendBack(v[k]);
      }
    }
  }
}

export { server };
