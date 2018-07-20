import { get, setProperties } from '@ember/object';
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

  component.didResize(400, 300);

  assert.ok(component.get('src'));

  const uri = new URI(component.get('src'));

  assert.equal(config.APP.imgix.source, uri.host());
  assert.equal('https', uri.protocol());
  assert.equal('/users/1.png', uri.path());
  assert.equal(uri.getQueryParamValue('w'), 400);
  assert.equal(uri.getQueryParamValue('h'), 300);
  assert.ok(uri.getQueryParamValue('dpr'));
  assert.equal(uri.hasQueryParam('crop'), false);
  assert.equal(uri.getQueryParamValue('fit'), 'crop');
});

test('the generated src url has an ixlib parameter', function(assert) {
  const component = this.subject();
  setProperties(component, {
    path: '/users/1.png'
  });
  component.didResize(400, 300);

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
  component.didResize(400, 300);

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
  component.didResize(400, 300);

  const src = component.get('src');
  assert.ok(src.includes('ixlib=ember-') === false);

  config.APP.imgix.disableLibraryParam = oldDisableLibraryParam;
});

test('it does not generate a source without a width', function(assert) {
  const component = this.subject();

  setProperties(component, {
    path: '/users/1.png',
    _width: null
  });

  assert.equal(null, get(component, 'src'));
});

test('it respects the pixel step', function(assert) {
  const component = this.subject();

  setProperties(component, {
    path: '/users/1.png',
    pixelStep: 10
  });

  component.didResize(405, 300);

  const uri = new URI(component.get('src'));

  assert.equal(
    uri.getQueryParamValue('w'),
    '410',
    `Expected a step up to 410, instead stepped to: ${uri.getQueryParamValue(
      'w'
    )}`
  );
});

test('the dpr is constrained to a precision of 3', function(assert) {
  const oldDpr = window.devicePixelRatio;
  window.devicePixelRatio = 1.33333;

  const component = this.subject();

  setProperties(component, {
    path: 'test.png'
  });
  component.didResize(100, 100);
  const uri = new URI(component.get('src'));

  assert.equal(uri.getQueryParamValue('dpr'), '1.33');

  window.devicePixelRatio = oldDpr;
});
