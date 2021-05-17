const crypto = require('crypto');
const fetch = require('node-fetch');

async function syncBundle(pluginDetails, madocEndpoint, token, bundle) {
  const revision = crypto.createHash('sha1').update(`${bundle.code}+${Date.now()}`).digest('hex');
  await fetch(`${madocEndpoint}/api/madoc/development/dev-bundle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      plugin: {
        ...pluginDetails,
        development: {
          enabled: true,
          revision,
        },
      },
      bundle,
    }),
  });

  return revision;
}

module.exports = { syncBundle };
