import { moduleForComponent, test } from 'ember-qunit';
import uri from 'jsuri';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('imgix-image', 'Integration | Component | imgix image', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png"}}`);
  assert.ok(this.$());
});

test('it renders even more better', function(assert) {
  this.render(
    hbs`<div style='width:200px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
  );

  let url = new uri(this.$('img').attr('src'));
  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );
  assert.equal(url.path(), '/users/1.png');
});

test('it renders the correct path', function(assert) {
  this.render(hbs`<div style='width:1250px;height:200px;'>{{imgix-image path="/users/1.png"}}</div>`);

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
  this.render(hbs`<div style='width:1250px;height:400px;'>{{imgix-image path="/users/1.png"}}</div>`);
  let url = new uri(this.$('img').attr('src'));

  assert.equal(url.getQueryParamValue('w'), '1250');
  assert.equal(url.path(), '/users/1.png');
  assert.equal(url.getQueryParamValue('fit'), 'crop');
  assert.equal(url.hasQueryParam('crop'), false);
});

test('it maintains any query parameters passed in', function(assert) {
  assert.expect(2);
  this.render(hbs`<div style='width:1250px;height:200px;'>{{imgix-image path="/users/1.png?sat=100"}}</div>`);

  let url = new uri(this.$('img').attr('src'));
  assert.equal(url.getQueryParamValue('sat'), '100');
  assert.equal(url.getQueryParamValue('w'), '1250');
});

test('it renders with an aspect ratio', function(assert) {
  this.render(hbs`<div style='width:1250px;'>{{imgix-image path="/users/1.png" aspectRatio=1.3333}}</div>`);

  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );
  let url = new uri(this.$('img').attr('src'));

  assert.equal(url.getQueryParamValue('w'), '1250');
  assert.equal(url.getQueryParamValue('h'), '937');
});

test('it respects passed in `crop` and `fit` values', function(assert) {
  assert.expect(2);
  this.render(
    hbs`<div style='width:1250px;height:400px;'>{{imgix-image path="/users/1.png?sat=100&fit=min&crop=top,left"}}</div>`
  );

  let url = new uri(this.$('img').attr('src'));
  assert.equal(url.getQueryParamValue('fit'), 'min');
  assert.equal(url.getQueryParamValue('crop'), 'top,left');
});

test('it respects `crop` and `fit` values passed as attributes', function(assert) {
  assert.expect(2);
  this.render(
    hbs`{{imgix-image path="/users/1.png" crop="top,left" fit="min"}}`
  );

  let url = new uri(this.$('img').attr('src'));
  assert.equal(url.getQueryParamValue('crop'), 'top,left');
  assert.equal(url.getQueryParamValue('fit'), 'min');
});

test('it respects `auto` values passed as attributes', function(assert) {
  assert.expect(1);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" auto="compress,enhance"}}`
  );

  let url = new uri(this.$('img').attr('src'));
  assert.equal(url.getQueryParamValue('auto'), 'compress,enhance');
});

test('it allows setting the alt attribute', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png" alt="User 1"}}`);

  let alt = this.$('img').attr('alt');
  assert.equal(alt, 'User 1');
});

test('it allows passing ANY imgix parameter as an option hash', function(assert) {
  assert.expect(2);
  this.render(
    hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' options=(hash exp=20 invert=true)}}</div>`
  );

  let url = new uri(this.$('img').attr('src'));

  assert.equal(url.getQueryParamValue('exp'), 20);
  assert.equal(url.getQueryParamValue('invert'), 'true');
});
