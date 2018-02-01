'use strict';
const { init, JitterTrng } = require('../build/Release/jittertrng-native');

let code;
if(code = init())
  throw new Error('Failed to initialize Jitterentropy True Random Number Generator. Returned code: ' + code);

const proto = JitterTrng.prototype;
const uintMax = [
  0, 256, 65536, 16777216,
  4294967296, 1099511627776,
  281474976710656
];

function getByteCount(number) {
  number = Math.abs(number);
  for(let i = uintMax.length - 1; i > 0; i--)
    if(number < uintMax[i]) return i;
  return uintMax.length - 1;
}

proto.random = function(low, high) {
  if(!Buffer.isBuffer(this._bits))
    this._bits = Buffer.allocUnsafe(6);
  const count = this.read(this._bits, 6);
  if(count <= 0)
    throw new Error(`Failed to generate random number. Code: (${count})`);
  const result = this._bits.readUIntBE(0, count) / uintMax[count];
  return high ? result * (high - low) + low :
    low ? result * low : result;
};

proto.randomInt = function(low, high) {
  if(!Buffer.isBuffer(this._bits))
    this._bits = Buffer.allocUnsafe(6);
  const count = this.read(this._bits, getByteCount(high || low));
  if(count <= 0)
    throw new Error(`Failed to generate random number. Code: (${count})`);
  const result = this._bits.readUIntBE(0, count);
  return high ? result % (high - low) + low : result % low;
}

proto.generate = function(byteCount) {
  if(!(byteCount > 0))
    throw new TypeError('Invalid bytes count');
  const buf = Buffer.allocUnsafe(byteCount);
  const generatedCount = this.read(buf, byteCount);
  if(generatedCount <= 0)
    throw new Error(`Failed to generate random number. Code: (${count})`);
  return buf.slice(0, generatedCount);
}

module.exports = { JitterTrng };