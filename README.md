# Madoc bundler

Develop plugins for [Madoc](https://github.com/digirati-co-uk/madoc-platform) locally with access to all of Madoc's API
and components.

## Installation

Install the package.
```
$ yarn add @madoc.io/bundler
```


Add some Madoc metadata to your `package.json`:
```json
{
  "madoc": {
    "id": "[ UUID v4 ]",
    "name": "[ Name of your plugin ]",
    "description": "[ Short description of what your plugin does ]"
  }
}
```

Make sure you have the `repository` and `name` fields set in your `package.json`.

## Usage

**Note you will need a [local version](https://github.com/digirati-co-uk/madoc-config) of Madoc running**

Sample `rollup.config.js` with React/Typescript:
```js
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

const isProduction = process.env.NODE_ENV === 'production';

export default {
    input: 'src/index.ts',
    output: [
        {
            dir: 'dist',
            format: 'umd',
            globals: {
                react: 'React',
            },
        },
    ],
    external: ['react'],
    plugins: [
        typescript({ target: 'es5' }),
        resolve({ browser: true }),
        isProduction && compiler(),
    ].filter(Boolean),
};
```

You can add scripts to your package.json
```json
{
  "scripts": {
    "start": "madoc-bundler --watch",
    "build": "NODE_ENV=production madoc-bundler"
  }
}
```

and run them with:
```
$ npm run start
```

or
```
$ yarn start
```

When you run this, you will be prompted to provide the URL of your Madoc instance. You can set this in an environment
variable:
```dotenv
MADOC_ENDPOINT=http://localhost:8888;
MADOC_SITE=default;
```

You will then be taken to your madoc site where you can install your plugin. Once you've done this, any changes you make
will be reflected on madoc (with a page refresh). This includes server-side rendering.

Plugins are applied per-site.

## Getting started
There are 3 hooks into Madoc implemented at the moment.

- hookRoutes
- hookComponents
- hookBlocks

### hookRoutes
This hook allows you to create custom pages in Madoc. Simply return a list of routes you'd like added, and they 
will be added to the end of the router. The router used is [React router](https://github.com/ReactTraining/react-router). Definitions follow their format. Components are just React components. 

```javascript
// src/index.js

export function hookBlocks() {
  return [
    {
      path: '/my-plugin/some-page',
      component: TestPluginPage,
      exact: true,
    },
  ]
}
```

#### Server rendering
To render data on the server, you can use the `Madoc.serverRendererFor` helper:
```javascript

function TestPluginPage({ loader }) {
  // A helper is injected for data loading. This desugars to: Madoc.useData(TestPluginPage);
  // This uses React Query under the hook.
  // Documentation: https://react-query-v2.tanstack.com/docs/guides/queries
  const { data, isLoading } = loader.useData(); 
  
  if (isLoading || !data) {
    return <div>loading...</div>
  }
  
  // Use data here.
  return <div />
}

Madoc.serverRendererFor(TestPluginPage, {
  getKey: (params, query, pathname) => {
    // params from from your route. So /my-plugin/:test would yield {"test": "..."} in params
    // query is the query string
    // pathname is the full pathname on madoc (does not contain the site slug /s/default .. )
    
    // The full key returned should be unique based on the params and query. This will be used for caching.
    // The first part can be generic (e.g. ['load-page', { pageId: '1234' } ])
    // Checkout https://react-query-v2.tanstack.com/docs/guides/queries#array-keys for more details.
    return ['key-name', { page: query.page }];
  },
  getData: async (key, vars, api, pathname) => {
    // Key is the first part of your key above ('key-name')
    // vars is the second part of your key ({ page: 0 })
    // API is the full madoc API, same one used to build all current components.
    // Get data can return anything. It _should_ be a promise.
    return api.getCollections(vars.page);
  },
})
```

### hookComponents
You can use `hookComponents` to override existing pages on Madoc.

The component is a React component, and has the same API available and server rendering as `hookRoutes`
```js
// src/index.js

export function hookComponents() {
  return {
    AllCollections: ListCollectionsReplacement,
  }
}
```

Full list of components can be found [here](https://github.com/digirati-co-uk/madoc-platform/blob/v2/services/madoc-ts/src/frontend/site/components.tsx).

**You can access data loaders used on these pages through included hooks**

### hookBlocks
Madoc has a concept of a page block. Details can be found [here](https://github.com/digirati-co-uk/madoc-platform/pull/269).

```js
// src/index.js

export function hookBlocks() {
  return {
    MyTestBlock
  };
}

```

They are small React components that can be placed on various pages, configured and reordered as editorial content.
Depending on where a block is contextually on the site, it may have access to resources on the page (collections, 
manifest, canvases etc.). 

Example block:
```jsx
import React from 'react';

export const MyTestBlock = ({ text }) => {
    return <div>Display some configurable text: {text}</div>;
};

Madoc.blockConfigFor(MyTestBlock, {
  type: 'MyPlugin.MyTestBlock',
  label: 'My test block',
  defaultProps: {
    text: '',
  },
  editor: {
    text: 'text-field',
  },
  requiredContext: [],
  anyContext: [],
});
```

With this definition, users will be able to place instances of your block on Madoc pages. They will be shown a form
where they can configure the props (text in this example). 

**Blocks are still in early development.**


## Roadmap

This bundler is a preview for developing plugins. There is no current route to publishing and installing plugins.

- [ ] Github actions to publish bundles
- [ ] Template repository
- [ ] Documentation of plugin APIs (Madoc)
- [ ] Typescript definitions
- [ ] Installing plugins from Github on a madoc instance
