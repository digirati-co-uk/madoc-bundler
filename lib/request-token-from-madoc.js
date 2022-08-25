const http = require('http');
const crypto = require('crypto');
const querystring = require('querystring');
const url = require('url');
const open = require('open');
const { generateDeferredPromise } = require('./generate-deferred-promise');
const { green } = require('chalk');

async function requestTokenFromMadoc(madocEndpoint, defaultSite, pluginDetails) {
  // Next, start a small response server.
  const deferred = generateDeferredPromise();
  const done = generateDeferredPromise();
  const randomId = crypto.randomBytes(16).toString('hex');
  const tempServer = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url);
    const qs = reqUrl.search ? querystring.parse(reqUrl.search.slice(1)) : {};

    if (!qs.code || qs.code !== randomId) {
      res.write(`Something went wrong`);
      res.end();
      return;
    }

    if (reqUrl.pathname === '/plugin-info.json') {
      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': madocEndpoint,
        });
        return;
      }
      // We want the plugin info.
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': madocEndpoint,
      });
      res.write(JSON.stringify(pluginDetails));
      res.end();
      return;
    }

    if (!qs.token || !qs.code || qs.code !== randomId) {
      res.write(`Something went wrong`);
      res.end();
      return;
    }

    const firstBundle = generateDeferredPromise();

    deferred.resolve({
      token: qs.token,
      firstBundle: firstBundle,
      done: done.promise,
    });

    firstBundle.promise.then((bundle) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': madocEndpoint,
      });
      res.write(
        JSON.stringify({
          revision: bundle.revision,
        })
      );
      res.end();
      tempServer.close(() => {
        done.resolve();
      });
    });
  });

  console.log('opening installer...');
  tempServer.listen(7839);

  // Open up madoc
  await open(
    `${madocEndpoint}/s/${defaultSite}/admin/system/development?cb=http://localhost:7839&code=${randomId}`
  );

  console.log(
    `
    ${green`Go to the following URL to install your plugin:`}

        ${madocEndpoint}/s/${defaultSite}/admin/system/development?cb=http://localhost:7839&code=${randomId}
`
  );

  return await deferred.promise;
}
module.exports = { requestTokenFromMadoc };
