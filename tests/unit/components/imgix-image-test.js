import { setProperties } from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import URI from 'jsuri';
import config from 'ember-get-config';

moduleForComponent('imgix-image', 'Unit | Component | imgix image', {
  unit: true,
  needs: ['service:unifiedEventHandler']
});

test('it does not throw an exception when given an undefined path', function(assert) {
  var component = this.subject();
  setProperties(component, { path: undefined });
  this.render();
  assert.equal(component._state, 'inDOM');
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

// matcher should be in the form (url: string, uri: URI) => boolean
function expectSrcsTo(component, matcher) {
  const src = component.get('src');
  matcher(src, new URI(src));

  const srcSet = component.get('srcset');
  if (!srcSet) {
    throw new Error("srcSet doesn't exist");
  }
  const srcSets = srcSet.split(',').map(v => v.trim());
  const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
  srcSetUrls.forEach(srcSetUrl => {
    matcher(srcSetUrl, new URI(srcSetUrl));
  });
}
