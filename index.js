/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-imgix',

  isDevelopingAddon: function() {
    return true;
  },

  options: {
    nodeAssets: {
      'blueimp-md5': {
        srcDir: 'js',
        import: ['md5.min.js'],
      },
      urijs: {
        srcDir: 'src',
        import: ['URI.min.js'],
      },
      'js-base64': {
        import: ['base64.min.js'],
      },
      'imgix-core-js': {
        srcDir: 'dist',
        import: ['imgix-core-js.js'],
      }
    }
  },
};
