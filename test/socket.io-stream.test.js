import { describe, it, expect, beforeEach } from 'vitest';
import { io } from 'socket.io-client';
import { Emitter } from '@socket.io/component-emitter';
import ss from '../index.js';
import * as parser from '../lib/parser.js';
import { client } from './support/index.mjs';

describe('socket.io-stream', () => {
  it('should expose values', () => {
    expect(ss.Buffer).toBe(Buffer);
    expect(ss.Socket).toBeTypeOf('function');
    expect(ss.IOStream).toBeTypeOf('function');
    expect(ss.forceBase64).toBeTypeOf('boolean');
  });

  it('should always return a same instance for a socket', () => {
    const socket = client({ autoConnect: false });
    expect(ss(socket)).toBe(ss(socket));
  });

  it('should throw an error when resending a stream', () => {
    const socket = ss(client({ autoConnect: false }));
    const stream = ss.createStream();

    socket.emit('foo', stream);
    expect(() => {
      socket.emit('bar', stream);
    }).toThrow();
  });

  it('should throw an error when sending destroyed streams', () => {
    const socket = ss(client({ autoConnect: false }));
    const stream = ss.createStream();

    stream.destroy();
    expect(() => {
      socket.emit('foo', stream);
    }).toThrow();
  });

  describe('clean up', () => {
    let socket;
    let stream;
    let getStreams;

    beforeEach(() => {
      socket = ss(client({ autoConnect: false }));
      getStreams = () => Object.keys(socket.streams);
    });

    describe('local streams', () => {
      beforeEach(() => {
        stream = ss.createStream();
        socket.emit('foo', stream);
        expect(getStreams()).toHaveLength(1);
      });

      it('should be cleaned up on error', () => {
        stream.emit('error', new Error());
        expect(getStreams()).toHaveLength(0);
      });

      it('should be cleaned up on finish', () => {
        return new Promise((done) => {
          stream.on('end', () => {
            expect(getStreams()).toHaveLength(0);
            done();
          });
          stream.emit('finish');
        });
      });

      it('should be cleaned up on end', () => {
        stream.emit('end');
        expect(getStreams()).toHaveLength(0);
      });
    });

    describe('remote streams', () => {
      beforeEach(() => {
        return new Promise((done) => {
          socket.on('foo', (s) => {
            expect(getStreams()).toHaveLength(1);
            stream = s;
            done();
          });
          // emit a new stream event manually.
          const encoder = new parser.Encoder();
          socket.$emit('foo', encoder.encode(ss.createStream()));
        });
      });

      it('should be cleaned up on error', () => {
        stream.emit('error', new Error());
        expect(getStreams()).toHaveLength(0);
      });

      it('should be cleaned up on finish', () => {
        return new Promise((done) => {
          stream.on('end', () => {
            expect(getStreams()).toHaveLength(0);
            done();
          });
          stream.emit('finish');
        });
      });

      it('should be cleaned up on end', () => {
        stream.emit('end');
        expect(getStreams()).toHaveLength(0);
      });
    });

    describe('when allowHalfOpen is enabled', () => {
      it('should clean up local streams only after both "finish" and "end" were called', () => {
        const halfOpenStream = ss.createStream({ allowHalfOpen: true });
        socket.emit('foo', halfOpenStream);
        expect(getStreams()).toHaveLength(1);

        halfOpenStream.emit('end');
        expect(getStreams()).toHaveLength(1);

        halfOpenStream.emit('finish');
        expect(getStreams()).toHaveLength(0);
      });

      it('should clean up remote streams only after both "finish" and "end" were called', () => {
        return new Promise((done) => {
          socket.on('bar', (s) => {
            expect(getStreams()).toHaveLength(1);

            s.emit('end');
            expect(getStreams()).toHaveLength(1);

            s.emit('finish');
            expect(getStreams()).toHaveLength(0);
            done();
          });
          // emit a new stream event manually.
          const encoder = new parser.Encoder();
          socket.$emit('bar', encoder.encode(ss.createStream({ allowHalfOpen: true })));
        });
      });
    });
  });

  describe('when socket.io has an error', () => {
    it('should propagate the error', () => {
      return new Promise((done) => {
        const sio = client({ autoConnect: false });
        const socket = ss(sio);
        socket.on('error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        // Socket.IO v4 restricts emit() for reserved events, use Emitter prototype directly
        Emitter.prototype.emit.call(sio, 'error', new Error());
      });
    });
  });

  describe('when socket.io is disconnected', () => {
    let stream;
    let disconnect;

    beforeEach(() => {
      const sio = client({ autoConnect: false });
      const socket = ss(sio);
      stream = ss.createStream();
      socket.emit('foo', stream);

      // Socket.IO v4 restricts emit() for reserved events like 'disconnect'
      // Use Emitter prototype directly to simulate disconnect
      disconnect = () => {
        Emitter.prototype.emit.call(sio, 'disconnect');
      };
    });

    it('should destroy streams', () => {
      disconnect();
      expect(stream.destroyed).toBeTruthy();
    });

    it('should trigger close event', () => {
      return new Promise((done) => {
        stream.on('close', done);
        disconnect();
      });
    });

    it('should trigger error event', () => {
      return new Promise((done) => {
        stream.on('error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        disconnect();
      });
    });
  });
});
