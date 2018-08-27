import { setProperties } from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import URI from 'jsuri';
import config from 'ember-get-config';

moduleForComponent('imgix-image', 'Unit | Component | imgix image', {
  unit: true,
  needs: ['service:unifiedEventHandler']
});

test('it renders', function(assert) {
  assert.expect(2);

  // Creates the component instance
  var component = this.subject();
  setProperties(component, { path: '/users/1.png' });
  assert.equal(component._state, 'preRender');

  // Renders the component to the page
  this.render();
  assert.equal(component._state, 'inDOM');
});

test('it does not throw an exception when given an undefined path', function(assert) {
  var component = this.subject();
  setProperties(component, { path: undefined });
  this.render();
  assert.equal(component._state, 'inDOM');
});

test('it sets the source correctly', function(assert) {
  const component = this.subject();

  setProperties(component, {
    path: '/users/1.png',
    _dpr: 1
  });

  assert.ok(component.get('src'));

  const uri = new URI(component.get('src'));
  const srcSet = component.get('srcSet');

  assert.equal(config.APP.imgix.source, uri.host());
  assert.equal('https', uri.protocol());
  assert.equal('/users/1.png', uri.path());
  assert.equal(uri.hasQueryParam('crop'), false);
  assert.equal(uri.getQueryParamValue('fit'), 'crop');
  assert.ok(srcSet.indexOf('/users/1.png') > -1);
});

test('the generated img has the correct number of srcSets', function(assert) {
  const expectedNumberOfSrcSets = 32;

  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png'
  });

  const srcSet = component.get('srcSet');
  const actualNumberOfSrcSets = srcSet.split(',').length;
  assert.equal(actualNumberOfSrcSets, expectedNumberOfSrcSets);
});
test('the generated img has srcSets in the correct format', function(assert) {
  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png'
  });

  const srcSet = component.get('srcSet');
  const srcSets = srcSet.split(',').map(v => v.trim());

  const srcSetsWithoutFallback = srcSets.slice(0, -1);

  srcSetsWithoutFallback.forEach(srcSet => {
    assert.equal(srcSet.split(' ').length, 2);
    const [url, width] = srcSet.split(' ');
    assert.ok(url);
    assert.ok(width.match(/^\d+w$/));
  });

  const fallbackSrcSet = srcSets[srcSets.length - 1];
  assert.equal(fallbackSrcSet.split(' ').length, 1);
  assert.notOk(fallbackSrcSet.match(/^\d+w$/));
});

test('the generated src url has an ixlib parameter', function(assert) {
  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png'
  });

  const src = component.get('src');
  const url = new URI(src);
  assert.ok(src.includes('ixlib=ember-'));
  assert.ok(/^ember-\d\.\d\.\d$/.test(url.getQueryParamValue('ixlib')));
});

test('setting disableLibraryParam should cause the url not to contain an ixlib parameter', function(assert) {
  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png',
    disableLibraryParam: true
  });

  const src = component.get('src');
  assert.ok(src.includes('ixlib=ember-') === false);
});

test('setting disableLibraryParam in the global config should cause the url not to contain an ixlib parameter', function(assert) {
  const oldDisableLibraryParam = config.APP.imgix.disableLibraryParam;

  config.APP.imgix.disableLibraryParam = true;
  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png'
  });

  const src = component.get('src');
  assert.ok(src.includes('ixlib=ember-') === false);

  config.APP.imgix.disableLibraryParam = oldDisableLibraryParam;
});
