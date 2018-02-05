'use strict';
const { init, JitterTrng } = require('../build/Release/jittertrng-native');
const { uintMax, getByteCount } = require('./utils');

let code;
if(code = init())
  throw new Error(`Failed to initialize Jitterentropy True Random Number Generator. Returned code:  ${code}`);

const proto = JitterTrng.prototype;

proto.read = function(buffer, size) {
  if(this.__inuse)
    throw new Error('Current instance is working');
  if(!Buffer.isBuffer(buffer))
    throw new TypeError('Buffer is not a buffer.');
  try {
    this.__inuse = true;
    return readCallback(this._read(buffer, size));
  } finally {
    this.__inuse = false;
    handleReadQueue(this);
  }
}

function readCallback(result) {
  switch(result) {
    case -1: throw new Error('FIPS 140-2 self test failed.');
    case -2: throw new Error('Engine not initialized.');
    default:
      if(result < 0)
        throw new Error(`Unknown error code: ${result}`);
      return result;
  }
}

function readAsyncPromise(rng, buffer, size) {
  return new Promise((resolve, reject) => {
    if(rng.__last) {
      const last = rng.__last;
      rng.__last = { resolve, reject, buffer, size };
      if(last) last.next = rng.__last;
    } else {
      rng.__next = rng.__last = { resolve, reject, buffer, size };
      handleReadQueue(rng);
    }
  });
}

function handleReadQueue(rng) {
  if(rng.__inuse || !rng.__next)
    return;
  const current = rng.__next;
  rng.__inuse = true;
  rng._readAsync(current.buffer, current.size, result => {
    try { current.resolve(readCallback(result)); }
    catch(e) { current.reject(e); }
    finally {
      rng.__inuse = false;
      rng.__next = current.next;
      if(current.next)
        handleReadQueue(rng);
      else
        rng.__last = null;
    }
  });
}

proto.readAsync = function(buffer, size, callback) {
  if(!Buffer.isBuffer(buffer))
    throw new TypeError('Buffer is not a buffer.');
  if(!callback && typeof size === 'function')
    callback = size;
  if(!(size > 0))
    size = buffer.length;
  const promise = readAsyncPromise(this, buffer, size);
  if(typeof callback !== 'function')
    return promise;
  promise.then(result => callback(null, result), callback);
}

function ensureBuffer(rng) {
  if(!Buffer.isBuffer(rng._bits) || rng._bits.length < 6)
    rng._bits = Buffer.allocUnsafe(6);
}

function randomCallback(bits, low, high, count) {
  const result = bits.readUIntBE(0, count) / uintMax[count];
  return high ? result * (high - low) + low :
    low ? result * low : result;
}

proto.random = function(low, high, precision = 6) {
  ensureBuffer(this);
  if(precision < 1)
    precision = 1;
  else if(precision > 6)
    precision = 6;
  const count = this.read(this._bits, precision);
  return randomCallback(this._bits, low, high, count);
};

proto.randomAsync = function(low, high, precision, callback) {
  ensureBuffer(this);
  if(!callback) {
    if(typeof precision === 'function') {
      callback = precision;
      precision = 6;
    } else if(typeof high === 'function') {
      callback = high;
      high = 0;
      precision = 6;
    } else if(typeof low === 'function') {
      callback = low;
      low = high = 0;
      precision = 6;
    }
  }
  if(precision < 1)
    precision = 1;
  else if(precision > 6)
    precision = 6;
  let promise = this.readAsync(this._bits, precision)
  .then(count => randomCallback(this._bits, low, high, count));
  if(typeof callback !== 'function')
    return promise;
  promise.then(result => callback(null, result), callback);
};

function randomIntCallback(bits, low, high, count) {
  const result = bits.readUIntBE(0, count);
  return high ? result % (high - low) + low : result % low;
}

proto.randomInt = function(low, high) {
  ensureBuffer(this);
  const count = this.read(
    this._bits,
    getByteCount(Number.isInteger(high) ? (high - low) : low)
  );
  return randomIntCallback(this._bits, low, high, count);
};

proto.randomIntAsync = function(low, high, callback) {
  ensureBuffer(this);
  let promise = this.readAsync(
    this._bits,
    getByteCount(Number.isInteger(high) ? (high - low) : low)
  );
  if(!callback && typeof high === 'function') {
    callback = high;
    high = 0;
  }
  promise = promise.then(count => randomIntCallback(this._bits, low, high, count));
  if(typeof callback !== 'function')
    return promise;
  promise.then(result => callback(null, result), callback);
};

proto.generate = function(byteCount) {
  if(!(byteCount > 0))
    throw new TypeError('Invalid bytes count');
  const buf = Buffer.allocUnsafe(byteCount);
  const count = this.read(buf, byteCount);
  return count === byteCount ? buf : buf.slice(0, count);
};

proto.generateAsync = function(byteCount, callback) {
  if(!(byteCount > 0))
    throw new TypeError('Invalid bytes count');
  const buf = Buffer.allocUnsafe(byteCount);
  const promise = this.readAsync(buf, byteCount)
  .then(count => (count === byteCount ? buf : buf.slice(0, count)));
  if(typeof callback !== 'function')
    return promise;
  promise.then(result => callback(null, result), callback);
};

module.exports = { JitterTrng };