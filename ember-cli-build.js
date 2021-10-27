/* eslint-env node */
'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const { maybeEmbroider } = require('@embroider/test-setup');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {
    snippetPaths: ['tests/dummy/app/snippets'],
    'ember-cli-babel': {
      includePolyfill: true
    }
  });

  if (app.env === 'test') {
    app.import('vendor/ember/ember-template-compiler.js');
  }

  return maybeEmbroider(app);
};
