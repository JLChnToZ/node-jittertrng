Node JitterTRNG
===============

This is a wrapper of jitterentropy-library, which is a Hardware RNG based on CPU timing jitter, for Node.js.

This is my first attempt to create a native C++ module for Node.js, therefore it might be many bugs and might be just works on my machine. I have made some modification on the original source (Added a header) in order to make it compilable on Windows platform.

Usage
-----

Please refer to [index.d.ts](lib/index.d.ts) for exposed classes. :)

Installation
------------

Currently this is still in alpha stage, and I will publish this to NPM soon.

If it has been published, it should be installable to Node.js projects via NPM by typing `npm i jittertrng` in terminals.

As this is a native addon module, to use it you will have to prepare suitable C++ compilers (gcc for *nix systems and Visual C++ with Windows SDK for Windows systems) and node-gyp as a global dependency. Prebuilt binaries are not yet available, sorry about that :(

Contributing
------------

Yes! If you don't mind my messy code and you want to make it better, issues and pull-requests are welcome!

License
-------

Original license for jitterentropy-library is duel-licensed with [BSD](deps/jitterentropy-library/COPYING.bsd) and [GPLv2](deps/jitterentropy-library/COPYING.gplv2), all original notes are kept untouched in it own dependency directory, and the wrapper is licensed with [MIT](LICENSE).