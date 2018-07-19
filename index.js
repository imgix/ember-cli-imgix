/* eslint-env node */
'use strict';

const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const path = require('path');
const FastbootTransform = require('fastboot-transform');

module.exports = {
  name: 'ember-cli-imgix',

  options: {
    babel: {
      plugins: [
        'inline-package-json',
        'transform-object-rest-spread',
      ],
    },
  },

  treeForVendor(vendorTree) {
    let trees = [];

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(FastbootTransform(
      new Funnel(path.dirname(require.resolve('js-base64')), {
        files: ['base64.js'],
        destDir: 'js-base64'
      })
    ));

    trees.push(FastbootTransform(
      new Funnel(path.dirname(require.resolve('imgix-core-js')), {
        files: ['imgix-core-js.js'],
        destDir: 'imgix-core-js'
      })
    ));

    trees.push(FastbootTransform(
      new Funnel(path.dirname(require.resolve('jsuri')), {
        files: ['Uri.js'],
        destDir: 'jsuri',
      })
    ));

    return MergeTrees(trees);
  },

  included() {
    this._super(arguments);

    // Order is important here. Just like regular script tags,
    // imgix-core-js depends on js-base64, so js-base64 has to come first.
    // The imgix-core-js shim depends on imgix-core-js, so that has to come last.
    this.import('vendor/js-base64/base64.js');
    this.import('vendor/imgix-core-js/imgix-core-js.js');
    this.import('vendor/imgix-core-js-shim.js');

    this.import('vendor/jsuri/Uri.js');
    this.import('vendor/jsuri-shim.js');
  }
};
