module.exports = {
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addBowerPackagesToProject([
      { name: 'imgix-core-js', target: '1.0.3' },
      { name: 'urijs', target: '~1.16.1' }
    ]);
  }
};
