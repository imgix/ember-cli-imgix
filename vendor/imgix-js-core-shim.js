(function() {

  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  generateModule('@imgix/js-core', { 'default': window.ImgixClient });
})();
