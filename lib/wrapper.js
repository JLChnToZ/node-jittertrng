'use strict';
const { init, JitterTrng: Native } = require('../build/Release/jittertrng-native');
const { uintMax, getByteCount, mapEnum } = require('./utils');

const JitterentropyFlags = mapEnum({
  NONE: 0,
  JENT_DISABLE_STIR: 1,
  JENT_DISABLE_UNBIAS: 2,
  JENT_DISABLE_MEMORY_ACCESS: 4,
});

const JitterentropyInitErrorCodes = mapEnum({
  OK: 0,
  ENOTIME: 1,
  ECOARSETIME: 2,
  ENOMONOTONIC: 3,
  EMINVARIATION: 4,
  EVARVAR: 5,
  EMINVARVAR: 6,
  EPROGERR: 7,
  ESTUCK: 8,
  EHEALTH: 9,
  ERCT: 10,
});

function getInitErrorMessage(code) {
  switch(code) {
    case 0: return 'Success';
    case 1: return 'Timer service not available';
    case 2: return 'Timer too coarse for RNG';
    case 3: return 'Timer is not monotonic increasing';
    case 4: return 'Timer variations too small for RNG';
    case 5: return 'Timer does not produce variations of variations (2nd derivation of time is zero)';
    case 6: return 'Timer variations of variations is too small';
    case 7: return 'Programming error';
    case 8: return 'Too many stuck results during init';
    default: return 'Unknown error';
  }
}

let initSuccess;

function initOrThrow() {
  if(initSuccess) return;
  const errno = init();
  if(errno) {
    const message = getInitErrorMessage(errno);
    throw Object.assign(new Error(message), {
      errno, code: JitterentropyInitErrorCodes[errno]
    });
  }
  initSuccess = true;
}

const proto = Native.prototype;

// Unexpose the undely native read entropy function.
const { _read, _readAsync } = proto;
delete proto._read;
delete proto._readAsync;

class JitterTrng extends Native {
  constructor(osr, flags) {
    initOrThrow();
    super(osr, flags);
  }

  read(buffer, size) {
    if(this.__inuse)
      throw new Error('Current instance is working');
    if(!Buffer.isBuffer(buffer))
      throw new TypeError('Buffer is not a buffer.');
    try {
      this.__inuse = true;
      return readCallback(_read.call(this, buffer, size));
    } finally {
      this.__inuse = false;
      handleReadQueue(this);
    }
  }

  readAsync(buffer, size, callback) {
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

  random(low, high, precision = 6) {
    ensureBuffer(this);
    if(precision < 1)
      precision = 1;
    else if(precision > 6)
      precision = 6;
    const count = this.read(this._bits, precision);
    return randomCallback(this._bits, low, high, count);
  }

  randomAsync(low, high, precision, callback) {
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
  }

  randomInt(low, high) {
    ensureBuffer(this);
    const count = this.read(
      this._bits,
      getByteCount(Number.isInteger(high) ? (high - low) : low)
    );
    return randomIntCallback(this._bits, low, high, count);
  }

  randomIntAsync(low, high, callback) {
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
  }

  generate(byteCount) {
    if(!(byteCount > 0))
      throw new TypeError('Invalid bytes count');
    const buf = Buffer.allocUnsafe(byteCount);
    const count = this.read(buf, byteCount);
    return count === byteCount ? buf : buf.slice(0, count);
  }

  generateAsync(byteCount, callback) {
    if(!(byteCount > 0))
      throw new TypeError('Invalid bytes count');
    const buf = Buffer.allocUnsafe(byteCount);
    const promise = this.readAsync(buf, byteCount)
    .then(count => (count === byteCount ? buf : buf.slice(0, count)));
    if(typeof callback !== 'function')
      return promise;
    promise.then(result => callback(null, result), callback);
  }
}

function readCallback(result) {
  if(result < 0) {
    let message;
    switch(result) {
      case -1: message = 'FIPS 140-2 self test failed.'; break;
      case -2: message = 'Engine not initialized.'; break;
      default: message = 'Unknown error';
    }
    const err = new Error(message);
    err.code = err.errno = result;
    throw err;
  }
  return result;
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
  _readAsync.call(rng, current.buffer, current.size, result => {
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

function ensureBuffer(rng) {
  if(!Buffer.isBuffer(rng._bits) || rng._bits.length < 6)
    rng._bits = Buffer.allocUnsafe(6);
}

function randomCallback(bits, low, high, count) {
  const result = bits.readUIntBE(0, count) / uintMax[count];
  return high ? result * (high - low) + low :
    low ? result * low : result;
}

function randomIntCallback(bits, low, high, count) {
  const result = bits.readUIntBE(0, count);
  return high ? result % (high - low) + low : result % low;
}

module.exports = { JitterTrng, JitterentropyFlags, JitterentropyInitErrorCodes };