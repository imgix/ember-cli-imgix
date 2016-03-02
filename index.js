/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-imgix',

  isDevelopingAddon: function() {
    return true;
  },

  included: function(app) {
    this.app.import(app.bowerDirectory + '/md5/build/md5.min.js');
    this.app.import(app.bowerDirectory + '/uri.js/src/URI.js');
    this.app.import(app.bowerDirectory + '/js-base64/base64.js');
    this.app.import(app.bowerDirectory + '/imgix-core-js/dist/imgix-core-js.js');
  }
};
