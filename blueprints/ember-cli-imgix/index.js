module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addBowerPackagesToProject([
      { name: 'ember-cli-imgix-core-js-shim', target: '0.02' },
      { name: 'imgix-core-js', target: '0.1.1' }
    ]);
  }
};
