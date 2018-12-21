'use strict';
const uintMax = [];
for(let i = 0; i < 7; i++)
  uintMax[i] = Math.pow(2, i * 8);
exports.uintMax = uintMax;

exports.getByteCount = function(number) {
  number = Math.abs(number);
  for(let i = uintMax.length - 1; i > 0; i--)
    if(number < uintMax[i]) return i;
  return uintMax.length - 1;
};

exports.delayOneTick = function(value) {
  return new Promise(resolve => setImmediate(resolve, value));
};

exports.mapEnum = function(kvp) {
  for(const key of Object.keys(kvp))
    kvp[kvp[key]] = key; 
  return kvp;
}
