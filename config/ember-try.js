'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-3.20',
        npm: {
          devDependencies: {
            'ember-source': '~3.20.5',
          },
        },
      },
      {
        name: 'ember-lts-3.24',
        npm: {
          devDependencies: {
            'ember-source': '~3.24.3',
          },
        },
      },
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0',
          },
        },
      },
      // Comment out the release, beta and canary builds as they use Ember@4
      // which is not compatible atm
      // {
      //   name: 'ember-release',
      //   npm: {
      //     devDependencies: {
      //       'ember-source': await getChannelURL('release'),
      //     },
      //   },
      // },
      // {
      //   name: 'ember-beta',
      //   npm: {
      //     devDependencies: {
      //       'ember-source': await getChannelURL('beta'),
      //     },
      //   },
      // },
      // {
      //   name: 'ember-canary',
      //   npm: {
      //     devDependencies: {
      //       'ember-source': await getChannelURL('canary'),
      //     },
      //   },
      // },
      {
        name: 'ember-classic',
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': true,
            'default-async-observers': false,
            'template-only-glimmer-components': false,
          }),
        },
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0',
          },
          ember: {
            edition: 'classic',
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
