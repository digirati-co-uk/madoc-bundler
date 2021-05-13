// 1. Load and Validate package.json
// 2. Verify connection with Madoc development server
//    - If not verified, pop open madoc to install module
//    - Once verified, a token will be provided
// 3. Run bundler
// 4. Take bundle and post to Madoc
//    - Madoc will save to disk
//    - Madoc will refresh bundle (possibly restart to begin with)
// 5. Watch for changes, go to 3.

const { prompt } = require('enquirer');
const { red, green } = require('chalk');

// Roll up dependencies.
const path = require('path');
const parseRepo = require('parse-github-repo-url');
const yargs = require('yargs/yargs');
const fs = require('fs');
const { validatePackageJson } = require('../lib/validate-package-json');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

// Verify connection with madoc development server.
const initialToken = process.env.MADOC_TOKEN;
const endpoint = process.env.MADOC_ENDPOINT;
const defaultSite = process.env.MADOC_SITE || 'default';

const pkgFile = path.join(process.cwd(), 'package.json');
const rollupConfig = path.join(process.cwd(), 'rollup.config.js');

if (!fs.existsSync(pkgFile)) {
  console.log(red`No package.json found.`);
  process.exit(1);
}

if (!fs.existsSync(rollupConfig)) {
  console.log(red`No rollup.config.js found.`);
  process.exit(1);
}

const pkg = require(path.join(process.cwd(), 'package.json'));
const { watchBundle } = require('../lib/watch-bundle');
const { createBundle } = require('../lib/create-bundle');
const { requestTokenFromMadoc } = require('../lib/request-token-from-madoc');
const { syncBundle } = require('../lib/sync-bundle');

// Validate the plugin.
validatePackageJson(pkg);

// The details of the plugin.
const [owner, name] = parseRepo(pkg.repository);
const pluginDetails = {
  id: pkg.madoc.id,
  name: pkg.madoc && pkg.madoc.name ? pkg.madoc.name : pkg.name,
  version: pkg.version,
  description: pkg.madoc && pkg.madoc.description ? pkg.madoc.description : pkg.description,
  repository: {
    owner,
    name,
  },
};

(async () => {
  // Confirm the endpoint.
  const { madocEndpoint } = endpoint
    ? { madocEndpoint: endpoint }
    : await prompt({
        type: 'input',
        name: 'madocEndpoint',
        message: 'Madoc endpoint',
        required: true,
        initial: 'http://localhost:8888',
      });

  // Request token from Madoc site, will open browser to confirm.
  const { token, firstBundle, done } = initialToken
    ? { token: initialToken }
    : await requestTokenFromMadoc(madocEndpoint, defaultSite, pluginDetails);

  // Create our bundle.
  const bundle = await createBundle();
  if (!bundle) {
    process.exit(1);
  }

  // Sync the bundle.
  const rev = await syncBundle(pluginDetails, madocEndpoint, token, bundle);

  if (firstBundle) {
    // Let madoc know what the bundle ID was
    firstBundle.resolve({ revision: rev });
  }

  if (argv.watch) {
    // Watch for changes. (--watch)
    await watchBundle(madocEndpoint, token, pluginDetails);
  }

  if (done) {
    await done;
  }

  console.log(green`✨  Done`);
  process.exit(0);
})();
