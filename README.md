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

Or in a more convenient way:
```javascript
const { RandomStream } = require('jittertrng');

(async() => {
  const rng = await RandomStream.create(1024); // Create a buffered random pool with 1024 bytes.
  // You also can use `new RandomStream(...)` constructor, but you have to be patient
  // because the pool does not immediately get ready after it constructs. (Async logic is used here)
  rng.random();
  rng.random(1, 10);
  rng.randomInt(1, 100);
  // Keep in mind that if the pool is already drain (and of cause it will starts to fill up at the background),
  // whatever you want to get, you will get undefined.
})();
```

Limits
------

As this is a true random number generator, it is not very efficient to get large amount of random numbers directly,
even here I have made asynchronous direct and buffered methods to access the entropy. If you needs random values immediately at anytime
and doesn't really mind the randomness, it is recommend to use other pseudo random number generators as a fallback,
or you have another option to just use this as a source of seed for other pseudo random number generators.

Also, I don't make the memory secure here, this wrapper just pulls the random bytes out and pass it to the JavaScript engine,
nothing is protecting them to prevent third party to access or spy on them.
So if anyone wants to use this in something secure-critical is not recommend.

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