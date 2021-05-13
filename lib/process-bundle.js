async function processBundle(pluginDetails, bundle) {
  const bundleOutput = await bundle.generate({
    format: 'umd',
    name: pluginDetails.id,
  });
  const output = bundleOutput.output;

  const entry = output.find((item) => item.isEntry);

  await bundle.close();

  const features = {
    hookBlocks: entry.exports.indexOf('hookBlocks') !== -1,
    hookComponents: entry.exports.indexOf('hookComponents') !== -1,
    hookRoutes: entry.exports.indexOf('hookRoutes') !== -1,
  };

  return {
    features,
    code: entry.code,
  };
}

module.exports = { processBundle };
