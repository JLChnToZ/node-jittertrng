'use strict';
const { init, JitterTrng } = require('../build/Release/jittertrng-native');

let code;
if(code = init())
  throw new Error(`Failed to initialize Jitterentropy True Random Number Generator. Returned code:  ${code}`);

const proto = JitterTrng.prototype;

const uintMax = [];
for(let i = 0; i < 7; i++)
  uintMax[i] = Math.pow(2, i * 8);

function getByteCount(number) {
  number = Math.abs(number);
  for(let i = uintMax.length - 1; i > 0; i--)
    if(number < uintMax[i]) return i;
  return uintMax.length - 1;
}

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

proto.readAsync = function(buffer, size, callback) {
  if(this.__inuse)
    throw new Error('Current instance is working');
  if(!Buffer.isBuffer(buffer))
    throw new TypeError('Buffer is not a buffer.');
  if(!callback && typeof size === 'function')
    callback = size;
  if(!(size > 0))
    size = buffer.length;
  this.__inuse = true;
  return typeof callback === 'function' ?
    this._readAsync(buffer, size, (result) => {
      try { callback(null, readCallback(result)); }
      catch(e) { callback(e); }
      finally { this.__inuse = false; }
    }) :
    new Promise((resolve, reject) =>
      this._readAsync(buffer, size, result => {
        try { resolve(readCallback(result)); }
        catch(e) { reject(e); }
        finally { this.__inuse = false; }
      })
    );
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

proto.random = function(low, high) {
  ensureBuffer(this);
  const count = this.read(this._bits, 6);
  return randomCallback(this._bits, low, high, count);
};

proto.randomAsync = function(low, high, callback) {
  ensureBuffer(this);
  let promise = this.readAsync(this._bits, 6);
  if(!callback) {
    if(typeof high === 'function') {
      callback = high;
      high = 0;
    } else if(typeof low === 'function') {
      callback = low;
      low = high = 0;
    }
  }
  promise = promise.then(count => randomCallback(this._bits, low, high, count));
  if(typeof callback === 'function')
    promise.then(result => callback(null, result), callback);
  else
    return promise;
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
  if(typeof callback === 'function')
    promise.then(result => callback(null, result), callback);
  else
    return promise;
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
  if(typeof callback === 'function')
    promise.then(result => callback(null, result), callback);
  else
    return promise;
};

module.exports = { JitterTrng };