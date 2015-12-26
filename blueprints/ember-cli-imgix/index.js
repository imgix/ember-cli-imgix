module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addBowerPackagesToProject([
      'ember-cli-imgix-core-js-shim',
      'imgix-core-js'
    ]);
  }
};
