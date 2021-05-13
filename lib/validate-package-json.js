const { green, yellow } = require('chalk');
const uuid = require('uuid');
const parseRepo = require('parse-github-repo-url');

function validatePackageJson(pkg) {
  if (!pkg.name) {
    console.log(yellow`[name] field required in package.json`);
    process.exit(1);
  }

  if (!pkg.madoc || !pkg.madoc.id) {
    console.log(`
    ${yellow`[madoc] field required in package.json.`}
    
    "madoc": {
      "id": "${uuid.v4()}",
      "name": "My plugin",
      "description": "What my plugin does"
    }
    
    ${green`(We generated a UUID for you)`}
        `);
    process.exit(1);
  }

  const [name, repo] = parseRepo(pkg.repository);
  if (!name || !repo) {
    console.log(`
    ${yellow`[repository] field required in package.json`}
    
    "repository": "https://github.com/ ..."
    
    `);
  }
}

module.exports = { validatePackageJson };
