/* eslint-env node */
'use strict';

const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const path = require('path');
const FastbootTransform = require('fastboot-transform');

module.exports = {
  name: require('./package').name,

  options: {
    babel: {
      // Brought in via ember-cli-babel's dep on babel preset env
      plugins: ['@babel/plugin-proposal-object-rest-spread'],
    },
    '@embroider/macros': {
      setOwnConfig: {
        version: require('./package').version,
      },
    },
  },

  treeForVendor(vendorTree) {
    let trees = [];

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(
      FastbootTransform(
        new Funnel(path.dirname(require.resolve('@imgix/js-core')), {
          files: ['imgix-js-core.js'],
          destDir: 'imgix-js-core',
        })
      )
    );

    trees.push(
      FastbootTransform(
        new Funnel(path.dirname(require.resolve('js-base64')), {
          files: ['base64.js'],
          destDir: 'js-base64',
        })
      )
    );

    trees.push(
      new Funnel(path.dirname(require.resolve('jsuri')), {
        files: ['Uri.js'],
        destDir: 'jsuri',
      })
    );

    return MergeTrees(trees);
  },

  included() {
    this._super(arguments);

    this.import('vendor/js-base64/base64.js');
    this.import('vendor/imgix-js-core/imgix-js-core.js');
    this.import('vendor/imgix-js-core-shim.js');

    this.import('vendor/jsuri/Uri.js', {
      using: [
        {
          transformation: 'amd',
          as: 'jsuri',
        },
      ],
    });
  },
};
