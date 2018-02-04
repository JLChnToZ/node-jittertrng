'use strict';
const { Readable } = require('stream');
const { JitterTrng } = require('./wrapper');
const { uintMax, getByteCount, delayOneTick } = require('./utils');

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

  async _read(size) {
    if(size) {
      while(this._rng.__inuse) await delayOneTick();
      this.push(await this._rng.generateAsync(size));
    } else {
      do {
        while(this._rng.__inuse) await delayOneTick();
      } while(this.push(await this._rng.generateAsync(1024)));
    }
    this.emit('ready', this);
  }

  next(bytes) {
    if(bytes > 0) {
      const result = this.read(bytes);
      if(result)
        return result.readUIntBE(0, Math.min(6, bytes, result.length));
    }
  }

  random(min, max) {
    if(max === undefined) {
      max = min === undefined ? 1 : min;
      min = 0;
    }
    const v = this.next(6);
    if(v === undefined) return;
    return v / uintMax[6] * (max - min) + min;
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
    return new Promise(resolve => new RandomStream(options, osr, flags).once('ready', resolve));
  }
}

module.exports = { RandomStream };