const esbuild = require('esbuild');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');

esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  minify: true,
  globalName: 'ss',
  platform: 'browser',
  target: 'es2018',
  outfile: 'socket.io-stream.js',
  plugins: [
    polyfillNode({
      // Polyfills needed for this library
      polyfills: {
        util: true,
        events: true,
        buffer: true,
        stream: true,
        crypto: true,
      },
    }),
  ],
}).then(() => {
  console.log('Build complete: socket.io-stream.js');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
