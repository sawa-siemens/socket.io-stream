import { describe, it, expect } from 'vitest';
import ss from '../index.js';
import * as parser from '../lib/parser.js';

describe('parser', () => {
  it('should encode/decode a stream', () => {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const stream = ss.createStream();
    const result = decoder.decode(encoder.encode(stream));
    expect(result).toBeInstanceOf(ss.IOStream);
    expect(result).not.toBe(stream);
  });

  it('should keep stream options', () => {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const stream = ss.createStream({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
    const result = decoder.decode(encoder.encode(stream));
    expect(result.options).toEqual({ highWaterMark: 10, objectMode: true, allowHalfOpen: true });
  });

  it('should encode/decode every streams', () => {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const result = decoder.decode(encoder.encode([
      ss.createStream(),
      { foo: ss.createStream() },
    ]));
    expect(result[0]).toBeInstanceOf(ss.IOStream);
    expect(result[1].foo).toBeInstanceOf(ss.IOStream);
  });

  it('should keep non-stream values', () => {
    const encoder = new parser.Encoder();
    const decoder = new parser.Decoder();
    const result = decoder.decode(encoder.encode([1, 'foo', { foo: 'bar' }, null, undefined]));
    expect(result).toEqual([1, 'foo', { foo: 'bar' }, null, undefined]);
  });

  describe('Encoder', () => {
    it('should fire stream event', () => {
      return new Promise((done) => {
        const encoder = new parser.Encoder();
        const stream = ss.createStream();
        encoder.on('stream', (s) => {
          expect(s).toBe(stream);
          done();
        });
        encoder.encode(stream);
      });
    });
  });

  describe('Decoder', () => {
    it('should fire stream event', () => {
      const encoder = new parser.Encoder();
      const decoder = new parser.Decoder();
      let stream;
      decoder.on('stream', (s) => {
        stream = s;
      });
      const decoded = decoder.decode(encoder.encode(ss.createStream()));
      expect(stream).toBe(decoded);
    });
  });
});
