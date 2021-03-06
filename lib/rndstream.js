'use strict';
const { Readable } = require('stream');
const { JitterTrng } = require('./wrapper');
const { uintMax, getByteCount } = require('./utils');

class RandomStream extends Readable {
  constructor(options, osr, flags) {
    // Only accepts highWaterMark options
    switch(typeof options) {
      case 'number': super({ highWaterMark: options }); break;
      case 'object': super(options && options.highWatermark && {
        highWaterMark: options.highWatermark
      }); break;
      default: super(); break;
    }
    this._rng = new JitterTrng(osr, flags);
    this.read(0); // Trigger the stream to start pumping the bits out.
  }

  async _read() {
    let size = 128;
    while(this.push(await this._rng.generateAsync(size)))
      if('readableLength' in this) // Node.js v9.3 or later versions only.
        // Calculate the most efficient count of bytes to get at once.
        // 64 < size * 2 < target remain
        size = Math.min(size << 1, Math.max(64, 1 << 31 - Math.clz32(
          this.readableHighWaterMark - this.readableLength
        )));
  }

  next(bytes) {
    if(bytes > 0) {
      if(bytes > 6) bytes = 6;
      const result = this.read(bytes);
      if(result)
        return result.readUIntBE(0, Math.min(bytes, result.length));
    }
  }

  random(min, max, precision = 6) {
    if(max === undefined) {
      max = min === undefined ? 1 : min;
      min = 0;
    }
    if(precision < 1)
      precision = 1;
    else if(precision > 6)
      precision = 6;
    const v = this.next(precision);
    if(v === undefined) return;
    return v / uintMax[precision] * (max - min) + min;
  }

  randomInt(min, max) {
    if(max === undefined) {
      max = min;
      min = 0;
    }
    const v = this.next(getByteCount(max - min));
    if(v === undefined) return;
    return v % (max - min) + min;
  }

  static create(options, osr, flags) {
    return new Promise(resolve => new RandomStream(options, osr, flags)
      .once('readable', function() {
        return resolve(this);
      })
    );
  }
}

module.exports = { RandomStream };