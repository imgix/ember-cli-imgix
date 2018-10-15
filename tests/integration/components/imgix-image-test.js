import { module, test } from 'qunit';
/* global QUnit */

import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';
import config from 'ember-get-config';

module('Integration | Component | imgix image', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders an image', async function(assert) {
    await render(hbs`{{imgix-image path="/users/1.png"}}`);
    assert.ok(this.$('img'));
  });

  test('it does not throw an exception when given an undefined path', async function(assert) {
    await render(hbs`{{imgix-image}}`);
    assert.notEqual(this.element.querySelector('img'), null);
  });

  test(`the rendered image's srcs have the correct path`, async function(assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.path(), '/users/1.png');
    });
  });

  test(`the rendered image's srcs have the correct host`, async function(assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(config.APP.imgix.source, uri.host());
      assert.equal('https', uri.protocol());
    });
  });

  test(`the image's srcs have the fit parameter set to crop by default`, async function(assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'crop');
    });
  });

  test(`the image's srcs contains an query parameters passed in via the 'path' attribute`, async function(assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png?sat=100"}}</div>`);

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

  test(`it respects the width and height passed in`, async function(assert) {
    await render(hbs`{{imgix-image path="/users/1.png" width=100 height=200}}`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('w'), '100');
      assert.equal(uri.getQueryParamValue('h'), '200');
    });
  });

  test(`it respects passed in 'crop' and 'fit' values`, async function(assert) {
    await render(
      hbs`{{imgix-image path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'min');
      assert.equal(uri.getQueryParamValue('crop'), 'top,left');
    });
  });

  test(`it respects 'crop' and 'fit' values passed as attributes`, async function(assert) {
    await render(
      hbs`{{imgix-image path="/users/1.png" crop="top,left" fit="min"}}`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'min');
      assert.equal(uri.getQueryParamValue('crop'), 'top,left');
    });
  });

  test(`it allows setting the 'alt' attribute`, async function(assert) {
    await render(hbs`{{imgix-image path="/users/1.png" alt="User 1"}}`);
    const alt = this.$('img').attr('alt');

    assert.equal(alt, 'User 1');
  });

  test('it allows passing ANY imgix parameter as an option hash', async function(assert) {
    await render(
      hbs`<div>{{imgix-image path='/users/1.png' options=(hash exp=20 invert=true)}}</div>`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('exp'), 20);
      assert.equal(uri.getQueryParamValue('invert'), 'true');
    });
  });

  test('attribute bindings: the draggable argument will set the draggable attribute on the image element', async function(assert) {
    await render(
      hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' draggable=false}}</div>`
    );

    assert.equal(this.$('img').attr('draggable'), 'false');
  });

  test('attribute bindings: the crossorigin argument will set the crossorigin attribute on the image element', async function(assert) {
    assert.expect(1);

    await render(
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
});
