import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import config from 'ember-get-config';
import URI from 'jsuri';

moduleForComponent(
  'imgix-image-wrapped',
  'Integration | Component | imgix image wrapped',
  {
    integration: true
  }
);

test('it renders', function(assert) {
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);
  assert.ok(this.$());
});

test('it renders event more better', function(assert) {
  this.render(
    hbs`<div style='width:200px;height:200px;'>{{imgix-image-wrapped path='/users/1.png' }}</div>`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );
  assert.equal(uri.path(), '/users/1.png');
});

test('it renders the correct path', function(assert) {
  this.render(
    hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png"}}</div>`
  );

  assert.ok(
    this.$('img')
      .attr('src')
      .indexOf('https://assets.imgix.net/users/1.png') > -1
  );
  assert.ok(
    this.$('img')
      .attr('src')
      .indexOf('w=1250') > -1
  );
});

test('it builds the default URL', function(assert) {
  this.render(
    hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png"}}</div>`
  );
  let uri = new URI(this.$('img').attr('src'));

  assert.equal(uri.getQueryParamValue('w'), '1250');
  assert.equal(uri.path(), '/users/1.png');
  assert.equal(uri.getQueryParamValue('fit'), 'crop');
  assert.equal(uri.hasQueryParam('crop'), false);
});

test('it maintains any query parameters passed in', function(assert) {
  assert.expect(2);
  this.render(
    hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png?sat=100"}}</div>`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('sat'), '100');
  assert.equal(uri.getQueryParamValue('w'), '1250');
});

test('it renders with an aspect ratio', function(assert) {
  this.render(
    hbs`<div style='width:1250px;'>{{imgix-image-wrapped path="/users/1.png" aspectRatio=1.3333}}</div>`
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
  assert.expect(2);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('fit'), 'min');
  assert.equal(uri.getQueryParamValue('crop'), 'top,left');
});

test('it respects `crop` and `fit` values passed as attributes', function(assert) {
  assert.expect(2);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" crop="top,left" fit="min"}}`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('crop'), 'top,left');
  assert.equal(uri.getQueryParamValue('fit'), 'min');
});

test('it respects `auto` values passed as attributes', function(assert) {
  assert.expect(1);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" auto="compress,enhance"}}`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('auto'), 'compress,enhance');
});

test('it allows setting the alt attribute', function(assert) {
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png" alt="User 1"}}`);

  let alt = this.$('img').attr('alt');
  assert.equal(alt, 'User 1');
});

test('the dpr is constrained to a precision of 3', function(assert) {
  const oldDpr = window.devicePixelRatio;
  window.devicePixelRatio = 1.33333;

  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

  const uri = new URI(this.$('img').attr('src'));

  assert.equal(uri.getQueryParamValue('dpr'), '1.33');

  window.devicePixelRatio = oldDpr;
});

test('the generated src url has an ixlib parameter', function(assert) {
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

  const src = this.$('img').attr('src');
  const uri = new URI(src);
  assert.ok(src.includes('ixlib=ember-'));
  assert.ok(/^ember-\d\.\d\.\d$/.test(uri.getQueryParamValue('ixlib')));
});

test('setting disableLibraryParam should cause the url not to contain an ixlib parameter', function(assert) {
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" disableLibraryParam=true}}`
  );

  const src = this.$('img').attr('src');
  assert.ok(src.includes('ixlib=ember-') === false);
});

test('setting disableLibraryParam in the global config should cause the url not to contain an ixlib parameter', function(assert) {
  const oldDisableLibraryParam = config.APP.imgix.disableLibraryParam;

  config.APP.imgix.disableLibraryParam = true;
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

  const src = this.$('img').attr('src');
  assert.ok(src.includes('ixlib=ember-') === false);

  config.APP.imgix.disableLibraryParam = oldDisableLibraryParam;
});
