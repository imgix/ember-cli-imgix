import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
/* global URI */

moduleForComponent('imgix-image', 'Unit | Component | imgix image', {
  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar'],
  unit: true
});

let defaultOptions = {
  _config: {
    APP: {
      imgix: {
        source: 'assets.imgix.net'
      }
    }
  }
};

test('it renders', function(assert) {
  assert.expect(2);

  // Creates the component instance
  var component = this.subject(defaultOptions);
  component.set('path', "/users/1.png");
  assert.equal(component._state, 'preRender');


  // Renders the component to the page
  this.render();
  assert.equal(component._state, 'inDOM');
});

test('it does not throw an exception when given an undefined path', function(assert) {
  var component = this.subject(defaultOptions);
  component.set('path', undefined);
  this.render();
  assert.equal(component._state, 'inDOM');
});

test('it sets the source correctly', function(assert) {
  var component = this.subject(defaultOptions);
  component.setProperties({
    path: "/users/1.png",
    _width: 400,
    _height: 300
  });

  let url = URI(component.get('src'));
  assert.equal(defaultOptions._config.APP.imgix.source, url.host());
  assert.equal('https', url.protocol());
  assert.equal('/users/1.png', url.path());
  assert.ok(url.hasQuery("w", 400));
  assert.ok(url.hasQuery("h", 300));
  assert.ok(url.hasQuery("dpr", 1));
  assert.ok(url.hasQuery("crop", "faces"));
  assert.ok(url.hasQuery("fit", "crop"));
});

test('it does not generate a source without a width', function(assert) {
  var component = this.subject(defaultOptions);
  component.setProperties({
    path: "/users/1.png",
    _width: null
  });

  assert.equal(null, component.get('src'));
});

test('it respects the pixel step', function(assert) {
  let component = this.subject(defaultOptions);
  component.setProperties({
    path: "/users/1.png",
    pixelStep: 10,
    element: Ember.Object.create({
      clientWidth: 405
    })
  });

  let url = URI(component.get('src'));
  assert.equal(url.search(true).w, "410", "Expected a step up to 410, instead stepped to: ", url.search(true).w);
});