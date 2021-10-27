const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

/* eslint-env node */
module.exports = {
  useYarn: true,
  useVersionCompatibility: false,
  scenarios: [
    {
      name: 'ember-lts-2.16',
      npm: {
        devDependencies: {
          'ember-source': 'lts'
        }
      }
    },
    {
      name: 'ember-stable',
      npm: {
        devDependencies: {
          'ember-source': 'latest'
        }
      }
    },
    {
      name: 'ember-beta',
      npm: {
        devDependencies: {
          'ember-source': 'beta'
        }
      }
    },
    {
      name: 'current',
      npm: {
        devDependencies: {}
      }
    },
    embroiderSafe(),
    embroiderOptimized(),
  ]
};
