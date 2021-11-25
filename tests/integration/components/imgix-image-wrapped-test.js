import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import config from 'ember-get-config';
import URI from 'jsuri';

module('Integration | Component | imgix image wrapped', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);
    assert.dom('img').exists();
  });

  test('it renders event more better', async function (assert) {
    await render(
      hbs`<div style='width:200px;height:200px;'>{{imgix-image-wrapped path='/users/1.png' }}</div>`
    );

    let uri = new URI(document.querySelector('img').src);
    assert.equal(uri.path(), '/users/1.png');
  });

  test('it renders the correct path', async function (assert) {
    await render(
      hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png"}}</div>`
    );

    assert.ok(
      document
        .querySelector('img')
        .src.indexOf('https://assets.imgix.net/users/1.png') > -1
    );
    assert.ok(document.querySelector('img').src.indexOf('w=1250') > -1);
  });

  test('it builds the default URL', async function (assert) {
    await render(
      hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png"}}</div>`
    );
    let uri = new URI(document.querySelector('img').src);

    assert.equal(uri.getQueryParamValue('w'), '1250');
    assert.equal(uri.path(), '/users/1.png');
    assert.equal(uri.getQueryParamValue('fit'), 'crop');
    assert.false(uri.hasQueryParam('crop'));
  });

  test('it maintains any query parameters passed in', async function (assert) {
    assert.expect(2);
    await render(
      hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png?sat=100"}}</div>`
    );

    let uri = new URI(document.querySelector('img').src);
    assert.equal(uri.getQueryParamValue('sat'), '100');
    assert.equal(uri.getQueryParamValue('w'), '1250');
  });

  test('it renders with an aspect ratio', async function (assert) {
    await render(
      hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png" aspectRatio=1.3333}}</div>`
    );

    let uri = new URI(document.querySelector('img').src);

    assert.equal(uri.getQueryParamValue('w'), '1250');
    assert.equal(uri.getQueryParamValue('h'), '937');
  });

  test('it respects passed in `crop` and `fit` values', async function (assert) {
    assert.expect(2);
    await render(
      hbs`{{imgix-image-wrapped path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
    );

    let uri = new URI(document.querySelector('img').src);
    assert.equal(uri.getQueryParamValue('fit'), 'min');
    assert.equal(uri.getQueryParamValue('crop'), 'top,left');
  });

  test('it respects `crop` and `fit` values passed as attributes', async function (assert) {
    assert.expect(2);
    await render(
      hbs`{{imgix-image-wrapped path="/users/1.png" crop="top,left" fit="min"}}`
    );

    let uri = new URI(document.querySelector('img').src);
    assert.equal(uri.getQueryParamValue('crop'), 'top,left');
    assert.equal(uri.getQueryParamValue('fit'), 'min');
  });

  test('it respects `auto` values passed as attributes', async function (assert) {
    assert.expect(1);
    await render(
      hbs`{{imgix-image-wrapped path="/users/1.png" auto="compress,enhance"}}`
    );

    let uri = new URI(document.querySelector('img').src);
    assert.equal(uri.getQueryParamValue('auto'), 'compress,enhance');
  });

  test('it allows setting the alt attribute', async function (assert) {
    await render(hbs`{{imgix-image-wrapped path="/users/1.png" alt="User 1"}}`);

    let alt = document.querySelector('img').alt;
    assert.equal(alt, 'User 1');
  });

  test('the dpr is constrained to a precision of 3', async function (assert) {
    const oldDpr = window.devicePixelRatio;
    window.devicePixelRatio = 1.33333;

    await render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

    const uri = new URI(document.querySelector('img').src);

    assert.equal(uri.getQueryParamValue('dpr'), '1.33');

    window.devicePixelRatio = oldDpr;
  });

  test('the generated src url has an ixlib parameter', async function (assert) {
    await render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

    const src = document.querySelector('img').src;
    const uri = new URI(src);
    assert.ok(src.includes('ixlib=ember-'));
    assert.ok(/^ember-\d\.\d\.\d$/.test(uri.getQueryParamValue('ixlib')));
  });

  test('setting disableLibraryParam should cause the url not to contain an ixlib parameter', async function (assert) {
    await render(
      hbs`{{imgix-image-wrapped path="/users/1.png" disableLibraryParam=true}}`
    );

    const src = document.querySelector('img').src;
    assert.false(src.includes('ixlib=ember-'));
  });

  test('setting disableLibraryParam in the global config should cause the url not to contain an ixlib parameter', async function (assert) {
    const oldDisableLibraryParam = config.APP.imgix.disableLibraryParam;

    config.APP.imgix.disableLibraryParam = true;
    await render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

    const src = document.querySelector('img').src;
    assert.false(src.includes('ixlib=ember-'));

    config.APP.imgix.disableLibraryParam = oldDisableLibraryParam;
  });
});
