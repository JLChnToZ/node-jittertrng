Node JitterTRNG
===============
[![GitHub issues](https://img.shields.io/github/issues/JLChnToZ/node-jittertrng.svg)](https://github.com/JLChnToZ/node-jittertrng/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node version](https://img.shields.io/node/v/jittertrng.svg)](package.json)
[![NPM version](https://img.shields.io/npm/v/jittertrng.svg)](https://www.npmjs.com/package/jittertrng)
[![NPM downloads](https://img.shields.io/npm/dt/jittertrng.svg)](https://www.npmjs.com/package/jittertrng)

This is a wrapper of jitterentropy-library, which is a hardware RNG based on CPU timing jitter, wrapped for Node.js.

For more information about this library, it is better to visit its site, [www.chronox.de/jent.html](http://www.chronox.de/jent.html).

This is my first attempt to create a native C++ module for Node.js, therefore it might be many bugs and might be just works on my machine. I have made some modification on the original source (Added a header) in order to make it compilable on Windows platform.

Usage
-----

Please refer to [documentation](https://code.moka-rin.moe/node-jittertrng) for exposed classes. :)

Example
```javascript
const { JitterTrng } = require('jittertrng');

const rng = new JitterTrng();

async function() {
  console.log(await rng.randomAsync(100)); // Asynchronous call, get a float-point number between 0 and 100
}

console.log(rng.randomInt(1234, 5678)); // Synchronous call, gets an integer number between 1234 and 5678

const randombytes = rng.generate(100); // Gets 100 random bytes as a buffer.

rng.generateAsync(10000, (err, buffer) => {
  // Gets 10000 random bytes as a buffer.
});
// Getting large amount of random bits at once is slow, therefore asynchronous call will be safer as this does not block the javascript execution thread.
// Also, all asynchronous methods also provides old-school callback flow for use.
```

Installation
------------

You can use
```sh
$ npm i jittertrng
```
to install this package.

As this is a native addon module, to use it you will have to prepare suitable C++ compilers (gcc for *nix systems and Visual C++ with Windows SDK for Windows systems) and node-gyp as a global dependency. Prebuilt binaries are not yet available, sorry about that :(

Contributing
------------

Yes! If you don't mind my messy code and you want to make it better, issues and pull-requests are welcome!

License
-------

Original jitterentropy-library is dual-licensed with [BSD](deps/jitterentropy-library/COPYING.bsd) and [GPLv2](deps/jitterentropy-library/COPYING.gplv2), all original notes are kept untouched in its own dependency directory. The wrapper and binding codes are licensed with [MIT](LICENSE).