'use strict';
const { init, JitterTrng } = require('../build/Release/jittertrng-native');

let code;
if(code = init())
  throw new Error('Failed to initialize Jitterentropy True Random Number Generator. Returned code: ' + code);

module.exports = { JitterTrng };