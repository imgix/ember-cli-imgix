(function() {

  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  generateModule('imgix-core-js', { 'default': window.ImgixClient });
})();
