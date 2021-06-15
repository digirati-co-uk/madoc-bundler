const { red, green, white, gray, bold, yellow } = require('chalk');

// Roll up dependencies.
const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const rollup = require('rollup');
const pkg = require('../package.json');
const fs = require('fs');

async function createProductionBundle(pluginDetails) {
  console.log(bold`\n Madoc bundler v${pkg.version}`);

  console.log(`\n
           ${gray`name`} ${bold`${pluginDetails.name}`}
    ${gray`description`} ${bold`${pluginDetails.description}`}
        ${gray`version`} ${bold`${pluginDetails.version}`}
  `);

  console.log(bold`\n Creating bundle...`);

  console.log(gray`  -> Loading rollup configuration`);
  const { options } = await loadConfigFile(path.resolve(process.cwd(), 'rollup.config.js'), { format: 'es' });
  const inputOptions = Array.isArray(options) ? options[0] : options;

  try {
    console.log(gray`  -> Running rollup`);
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    console.log(gray`  -> Generating ${green`dist/plugin.js`}`);
    await bundle.write({
      output: {
        format: 'umd',
        name: pluginDetails.id,
        globals: {
          '@madoc.io/types': 'Madoc',
        },
        file: 'dist/plugin.js',
      },
    });

    await bundle.close();

    console.log(gray`  -> Generating ${green`dist/madoc-plugin.json`}`);

    fs.writeFileSync(path.join(process.cwd(), 'dist', 'madoc-plugin.json'), JSON.stringify(pluginDetails, null, 4));

    console.log(bold`\n  🎉  Complete\n`);
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
