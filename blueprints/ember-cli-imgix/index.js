module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addBowerPackagesToProject([
      { name: 'imgix-core-js', target: '1.0.3' }
    ]);
  }
};
