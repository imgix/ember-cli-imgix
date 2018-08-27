/* global QUnit */

import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';
import config from 'ember-get-config';

moduleForComponent('imgix-image', 'Integration | Component | imgix image', {
  integration: true
});

test('it renders an image', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png"}}`);
  assert.ok(this.$('img'));
});

test(`the rendered image's srcs have the correct path`, function(assert) {
  this.render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.path(), '/users/1.png');
  });
});

test(`the rendered image's srcs have the correct host`, function(assert) {
  this.render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(config.APP.imgix.source, uri.host());
    assert.equal('https', uri.protocol());
  });
});

test(`the image's srcs have the fit parameter set to crop by default`, function(assert) {
  this.render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.getQueryParamValue('fit'), 'crop');
  });
});

test(`the image's srcs contains an query parameters passed in via the 'path' attribute`, function(assert) {
  this.render(hbs`<div>{{imgix-image path="/users/1.png?sat=100"}}</div>`);

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.getQueryParamValue('sat'), '100');
  });
});

QUnit.skip('it renders with an aspect ratio', function(assert) {
  this.render(
    hbs`<div>{{imgix-image path="/users/1.png" aspectRatio=1.3333}}</div>`
  );

  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );

  let uri = new URI(this.$('img').attr('src'));

  assert.equal(uri.getQueryParamValue('w'), '1250');
  assert.equal(uri.getQueryParamValue('h'), '937');
});

test('it respects passed in `crop` and `fit` values', function(assert) {
  this.render(
    hbs`{{imgix-image path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
  );

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.getQueryParamValue('fit'), 'min');
    assert.equal(uri.getQueryParamValue('crop'), 'top,left');
  });
});

test(`it respects 'crop' and 'fit' values passed as attributes`, function(assert) {
  this.render(
    hbs`{{imgix-image path="/users/1.png" crop="top,left" fit="min"}}`
  );

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.getQueryParamValue('fit'), 'min');
    assert.equal(uri.getQueryParamValue('crop'), 'top,left');
  });
});

test(`it allows setting the 'alt' attribute`, function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png" alt="User 1"}}`);
  const alt = this.$('img').attr('alt');

  assert.equal(alt, 'User 1');
});

test('it allows passing ANY imgix parameter as an option hash', function(assert) {
  this.render(
    hbs`<div>{{imgix-image path='/users/1.png' options=(hash exp=20 invert=true)}}</div>`
  );

  expectSrcsTo(this.$, (_, uri) => {
    assert.equal(uri.getQueryParamValue('exp'), 20);
    assert.equal(uri.getQueryParamValue('invert'), 'true');
  });
});

test('attribute bindings: the draggable argument will set the draggable attribute on the image element', function(assert) {
  this.render(
    hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' draggable=false}}</div>`
  );

  assert.equal(this.$('img').attr('draggable'), 'false');
});

test('attribute bindings: the crossorigin argument will set the crossorigin attribute on the image element', function(assert) {
  assert.expect(1);

  this.render(
    hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' crossorigin='imgix-is-rad'}}</div>`
  );

  assert.equal(this.$('img').attr('crossorigin'), 'imgix-is-rad');
});

// matcher should be in the form (url: string, uri: URI) => boolean
function expectSrcsTo($, matcher) {
  const src = $('img').attr('src');
  matcher(src, new URI(src));

  const srcSet = $('img').attr('srcset');
  if (!srcSet) {
    throw new Error("srcSet doesn't exist");
  }
  const srcSets = srcSet.split(',').map(v => v.trim());
  const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
  srcSetUrls.forEach(srcSetUrl => {
    matcher(srcSetUrl, new URI(srcSetUrl));
  });
}
