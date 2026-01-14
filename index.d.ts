/// <reference types="node" />

import { EventEmitter } from 'events';
import { Duplex, Readable, DuplexOptions } from 'stream';

/**
 * Socket.IO socket interface (compatible with both server and client sockets)
 */
export interface SocketIOSocketLike {
  on(event: string, callback: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): this;
  _streamSocket?: any; // Socket instance (using any to avoid circular reference)
}

/**
 * Options for creating a Socket instance
 */
export interface SocketOptions {
  /**
   * Forces base 64 encoding when emitting. Must be set to true for Socket.IO v0.9 or lower.
   * @default false
   */
  forceBase64?: boolean;
}

/**
 * Options for creating an IOStream
 */
export interface IOStreamOptions extends DuplexOptions {
  /**
   * Allow half-open sockets. If set to false, then the stream will automatically
   * end the writable side when the readable side ends.
   * @default false
   */
  allowHalfOpen?: boolean;
}

/**
 * Options for creating a BlobReadStream
 */
export interface BlobReadStreamOptions {
  /**
   * Use synchronous FileReader API
   * @default false
   */
  synchronous?: boolean;
  highWaterMark?: number;
}

/**
 * Bidirectional stream socket which wraps Socket.IO.
 * Extends EventEmitter and provides stream-based communication over Socket.IO.
 */
export class Socket extends EventEmitter {
  /**
   * Base event name for messaging.
   */
  static readonly event: string;

  /**
   * List of events that are handled directly by EventEmitter.
   */
  static readonly events: string[];

  /**
   * The underlying Socket.IO socket instance.
   */
  readonly sio: SocketIOSocketLike;

  /**
   * Whether to force base64 encoding.
   */
  readonly forceBase64: boolean;

  /**
   * Creates a new Socket instance.
   * @param sio - Socket.IO socket instance (server or client)
   * @param options - Socket options
   */
  constructor(sio: SocketIOSocketLike, options?: SocketOptions);

  /**
   * Emits streams to the corresponding server/client.
   * @param type - Event type
   * @param args - Additional arguments, which may include IOStream instances
   * @returns This Socket instance for chaining
   */
  emit(type: string, ...args: any[]): this;

  /**
   * Listens for stream events.
   * @param type - Event type
   * @param listener - Event listener function that receives streams and other arguments
   * @returns This Socket instance for chaining
   */
  on(type: string, listener: (...args: any[]) => void): this;

  /**
   * Listens for stream events (one-time).
   * @param type - Event type
   * @param listener - Event listener function that receives streams and other arguments
   * @returns This Socket instance for chaining
   */
  once(type: string, listener: (...args: any[]) => void): this;

  /**
   * Removes a listener for stream events.
   * @param type - Event type
   * @param listener - Event listener function
   * @returns This Socket instance for chaining
   */
  removeListener(type: string, listener: (...args: any[]) => void): this;

  /**
   * Removes all listeners for a specific event type.
   * @param type - Event type
   * @returns This Socket instance for chaining
   */
  removeAllListeners(type?: string): this;

  /**
   * Cleans up a stream by its ID.
   * @param id - Stream ID
   */
  cleanup(id: string): void;
}

/**
 * Duplex stream for Socket.IO communication.
 * Extends Node.js Duplex stream and can be used for bidirectional data transfer.
 */
export class IOStream extends Duplex {
  /**
   * Unique identifier for this stream.
   */
  readonly id: string;

  /**
   * The Socket instance this stream is associated with.
   */
  socket: Socket | null;

  /**
   * Whether this stream has been destroyed.
   */
  readonly destroyed: boolean;

  /**
   * Options passed during construction.
   */
  readonly options?: IOStreamOptions;

  /**
   * Creates a new IOStream instance.
   * @param options - Stream options
   */
  constructor(options?: IOStreamOptions);

  /**
   * Ensures that no more I/O activity happens on this stream.
   * Not necessary in the usual case.
   */
  destroy(): void;
}

/**
 * Readable stream for Blob and File objects on the browser.
 * Extends Node.js Readable stream.
 */
export class BlobReadStream extends Readable {
  /**
   * The Blob or File object being read.
   */
  readonly blob: Blob | File;

  /**
   * Creates a new BlobReadStream instance.
   * @param blob - Blob or File object to read from
   * @param options - Stream options
   */
  constructor(blob: Blob | File, options?: BlobReadStreamOptions);
}

/**
 * Main module function to look up or create a Socket instance.
 * This function also has properties attached to it (Socket, IOStream, etc.)
 */
declare function lookup(sio: SocketIOSocketLike, options?: SocketOptions): Socket;

declare namespace lookup {
  /**
   * Socket constructor class
   */
  const Socket: typeof Socket;
  
  /**
   * IOStream constructor class
   */
  const IOStream: typeof IOStream;
  
  /**
   * BlobReadStream constructor class
   */
  const BlobReadStream: typeof BlobReadStream;
  
  /**
   * Forces base 64 encoding when emitting. Must be set to true for Socket.IO v0.9 or lower.
   * @default false
   */
  let forceBase64: boolean;
  
  /**
   * Exposes Node Buffer for browser compatibility.
   */
  const Buffer: typeof global.Buffer;
  
  /**
   * Creates a new duplex stream.
   * @param options - Stream options
   * @returns New IOStream instance
   */
  function createStream(options?: IOStreamOptions): IOStream;
  
  /**
   * Creates a new readable stream for Blob/File on browser.
   * @param blob - Blob or File object to read from
   * @param options - Stream options
   * @returns New BlobReadStream instance
   */
  function createBlobReadStream(
    blob: Blob | File,
    options?: BlobReadStreamOptions
  ): BlobReadStream;
}

export = lookup;
