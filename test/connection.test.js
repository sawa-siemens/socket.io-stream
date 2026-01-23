import { describe, it, expect } from 'vitest';
import ss from '../index.js';
import { client } from './support/index.mjs';

describe('@sawa-siemens/socket.io-stream', () => {
  it('should send/receive a file', () => {
    return new Promise((done) => {
      const sums = [];
      const socket = client();
      socket.on('connect', () => {
        const file = ss.createStream();
        ss(socket).emit('read', file, 'test/support/frog.jpg', (sum) => {
          check(sum);
        });

        const checksum = ss.createStream();
        ss(socket).emit('checksum', checksum, (sum) => {
          check(sum);
        });

        file.pipe(checksum);

        function check(sum) {
          sums.push(sum);
          if (sums.length < 2) return;
          expect(sums[0]).toBe(sums[1]);
          socket.disconnect();
          done();
        }
      });
    });
  });

  it('should send/receive data in flowing mode', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket)
          .emit('echo', stream, { hi: 1 })
          .on('echo', (echoStream, obj) => {
            expect(obj).toEqual({ hi: 1 });

            let data = '';
            echoStream.on('data', (chunk) => {
              data += chunk;
            }).on('end', () => {
              expect(data).toBe('foobar');
              socket.disconnect();
              done();
            });
          });

        stream.write('foo');
        stream.write('bar');
        stream.end();
      });
    });
  });

  it('should send/receive data in paused mode', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket)
          .emit('echo', stream, { hi: 1 })
          .on('echo', (echoStream, obj) => {
            expect(obj).toEqual({ hi: 1 });

            let data = '';
            echoStream.on('readable', () => {
              let chunk;
              while ((chunk = echoStream.read()) !== null) {
                data += chunk;
              }
            }).on('end', () => {
              expect(data).toBe('foobar');
              socket.disconnect();
              done();
            });
          });

        stream.write('foo');
        stream.write('bar');
        stream.end();
      });
    });
  });

  it('should send/receive Buffer', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket)
          .emit('echo', stream)
          .on('echo', (echoStream) => {
            const buffers = [];
            echoStream.on('data', (chunk) => {
              buffers.push(chunk);
            }).on('end', () => {
              const buffer = Buffer.concat(buffers);
              expect(buffer.length).toBe(4);
              for (let i = 0; i < 4; i++) {
                expect(buffer[i]).toBe(i);
              }
              socket.disconnect();
              done();
            });
          });

        stream.write(Buffer.from([0, 1]));
        stream.write(Buffer.from([2, 3]));
        stream.end();
      });
    });
  });

  it('should send/receive an object in object mode', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream({ objectMode: true });
        ss(socket)
          .emit('echo', stream)
          .on('echo', (echoStream) => {
            const data = [];
            echoStream.on('data', (chunk) => {
              data.push(chunk);
            }).on('end', () => {
              expect(data.length).toBe(2);
              expect(data[0]).toEqual({ foo: 0 });
              expect(data[1]).toEqual({ bar: 1 });
              socket.disconnect();
              done();
            });
          });

        stream.write({ foo: 0 });
        stream.write({ bar: 1 });
        stream.end();
      });
    });
  });

  it('should send/receive streams in an array', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        ss(socket)
          .emit('echo', [ss.createStream(), ss.createStream()])
          .on('echo', (data) => {
            expect(data[0]).toBeInstanceOf(ss.IOStream);
            expect(data[1]).toBeInstanceOf(ss.IOStream);
            socket.disconnect();
            done();
          });
      });
    });
  });

  it('should send/receive streams in an object', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        ss(socket)
          .emit('echo', {
            foo: ss.createStream(),
            bar: ss.createStream(),
          })
          .on('echo', (data) => {
            expect(data.foo).toBeInstanceOf(ss.IOStream);
            expect(data.bar).toBeInstanceOf(ss.IOStream);
            socket.disconnect();
            done();
          });
      });
    });
  });

  it('should send/receive data through a same stream', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream({ allowHalfOpen: true });
        ss(socket).emit('sendBack', stream);
        stream.write('foo');
        stream.write('bar');
        stream.end();

        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        }).on('end', () => {
          expect(data).toBe('foobar');
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('should handle multiple streams', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream1 = ss.createStream();
        const stream2 = ss.createStream();
        ss(socket).emit('multi', stream1, stream2);
        stream1.write('foo');
        stream1.write('bar');
        stream1.end();

        let data = '';
        stream2.on('data', (chunk) => {
          data += chunk;
        }).on('end', () => {
          expect(data).toBe('foobar');
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('should get a stream through ack', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket).emit('ack', stream, (ackStream) => {
          let data = '';
          ackStream.on('data', (chunk) => {
            data += chunk;
          }).on('end', () => {
            expect(data).toBe('foobar');
            socket.disconnect();
            done();
          });
        });

        stream.write('foo');
        stream.write('bar');
        stream.end();
      });
    });
  });

  it('should get streams through ack as object and array', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        ss(socket).emit('ack', [ss.createStream(), { foo: ss.createStream() }], (data) => {
          expect(data[0]).toBeInstanceOf(ss.IOStream);
          expect(data[1].foo).toBeInstanceOf(ss.IOStream);
          socket.disconnect();
          done();
        });
      });
    });
  });

  it('should send an error happened on the client', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket).emit('clientError', stream, (msg) => {
          expect(msg).toBe('error on the client');
          done();
        });
        stream.emit('error', new Error('error on the client'));
      });
    });
  });

  it('should receive an error happened on the server', () => {
    return new Promise((done) => {
      const socket = client();
      socket.on('connect', () => {
        const stream = ss.createStream();
        ss(socket).emit('serverError', stream, 'error on the server');
        stream.on('error', (err) => {
          expect(err.message).toBe('error on the server');
          done();
        });
      });
    });
  });

  // BlobReadStream requires both Blob and FileReader (browser-only APIs)
  // Skip in Node.js environment
  describe.skipIf(typeof FileReader === 'undefined')('BlobReadStream', () => {
    it('should read blob', () => {
      return new Promise((done) => {
        const socket = client();
        socket.on('connect', () => {
          const stream = ss.createStream();
          ss(socket)
            .emit('echo', stream)
            .on('echo', (echoStream) => {
              let data = '';
              echoStream.on('data', (chunk) => {
                data += chunk;
              }).on('end', () => {
                expect(data).toBe('foobar');
                socket.disconnect();
                done();
              });
            });
          ss.createBlobReadStream(new Blob(['foo', 'bar'])).pipe(stream);
        });
      });
    });
  });
});
