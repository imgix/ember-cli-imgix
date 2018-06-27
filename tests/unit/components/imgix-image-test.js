import { get, setProperties } from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
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

  const url = new window.URL(component.get('src'));

  assert.equal(config.APP.imgix.source, url.host);
  assert.equal('https:', url.protocol);
  assert.equal('/users/1.png', url.pathname);
  assert.equal(url.searchParams.get('w'), 400);
  assert.equal(url.searchParams.get('h'), 300);
  assert.equal(url.searchParams.get('dpr'), 1);
  assert.equal(url.searchParams.get('crop'), 'faces');
  assert.equal(url.searchParams.get('fit'), 'crop');
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

  const url = new window.URL(component.get('src'));

  assert.equal(
    url.searchParams.get('w'),
    '410',
    `Expected a step up to 410, instead stepped to: ${url.searchParams.get(
      'w'
    )}`
  );
});
