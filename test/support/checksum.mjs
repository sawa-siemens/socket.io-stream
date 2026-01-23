import crypto from 'node:crypto';
import { PassThrough } from 'readable-stream';

export class Checksum extends PassThrough {
  constructor(options) {
    super(options);
    this.hash = crypto.createHash('sha1');
    this.resume();
  }

  _write(chunk, encoding, callback) {
    this.hash.update(chunk, encoding);
    super._write(chunk, encoding, callback);
  }

  digest() {
    return this.hash.digest('hex');
  }
}
