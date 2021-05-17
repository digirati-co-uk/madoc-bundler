const { red, green } = require('chalk');
const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const rollup = require('rollup');
const { generateDeferredPromise } = require('./generate-deferred-promise');
const { syncBundle } = require('./sync-bundle');
const { processBundle } = require('./process-bundle');

async function watchBundle(madocEndpoint, token, pluginDetails, onFirst) {
  const watching = generateDeferredPromise();
  const { options } = await loadConfigFile(path.resolve(process.cwd(), 'rollup.config.js'), { format: 'es' });
  const inputOptions = Array.isArray(options) ? options[0] : options;

  let hasFirst = false;
  const watcher = rollup.watch(inputOptions);
  watcher.on('event', (event) => {
    if (event.error) {
      console.log(red`${event.error}`);
    }
    if (event.code === 'BUNDLE_END') {
      processBundle(pluginDetails, event.result).then(async (bundle) => {
        console.log(green`\nsyncing bundle...`);
        const rev = await syncBundle(pluginDetails, madocEndpoint, token, bundle);
        if (!hasFirst) {
          onFirst(rev);
          hasFirst = true;
        }
        console.log('done!');
      });
    }
  });

  watcher.on('event', ({ result }) => {
    if (result) {
      result.close();
    }
  });

  process.on('SIGINT', async () => {
    watching.resolve();
    watcher.close();
  });

  return watching.promise;
}

module.exports = { watchBundle };
