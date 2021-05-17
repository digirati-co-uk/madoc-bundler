const { red } = require('chalk');

// Roll up dependencies.
const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const rollup = require('rollup');
const { processBundle } = require('./process-bundle');

async function createProductionBundle(pluginDetails) {
  const { options } = await loadConfigFile(path.resolve(process.cwd(), 'rollup.config.js'), { format: 'es' });
  const inputOptions = Array.isArray(options) ? options[0] : options;

  try {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    await bundle.write({
      output: {
        format: 'umd',
        name: pluginDetails.id,
        globals: {
          '@madoc.io/types': 'Madoc',
        },
        file: 'dist/index.js',
      },
    });

    await bundle.close();
  } catch (e) {
    if (e.plugin === 'typescript') {
      console.log('\n');
      console.log(e.loc.file);
      console.log(e.frame);
      console.log('\n');
    } else {
      console.log('\n');
      console.log(red`${e.message}`);
    }
  }
}

module.exports = { createProductionBundle };
