import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';

moduleForComponent('imgix-image', 'Integration | Component | imgix image', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png"}}`);
  assert.ok(this.$());
});

test('it renders event more better', function(assert) {
  this.render(
    hbs`<div style='width:200px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
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
  this.render(hbs`<div style='width:1250px;height:200px;'>{{imgix-image path="/users/1.png"}}</div>`);
  let uri = new URI(this.$('img').attr('src'));

  assert.equal(uri.getQueryParamValue('w'), '1250');
  assert.equal(uri.path(), '/users/1.png');
  assert.equal(uri.getQueryParamValue('fit'), 'crop');
  assert.equal(uri.hasQueryParam('crop'), false);
});

test('it maintains any query parameters passed in', function(assert) {
  assert.expect(2);
  this.render(hbs`<div style='width:1250px;height:200px;'>{{imgix-image path="/users/1.png?sat=100"}}</div>`);

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('sat'), '100');
  assert.equal(uri.getQueryParamValue('w'), '1250');
});

test('it renders with an aspect ratio', function(assert) {
  this.render(hbs`<div style='width:1250px;'>{{imgix-image path="/users/1.png" aspectRatio=1.3333}}</div>`);

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
    hbs`{{imgix-image path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
  );

  let uri = new URI(this.$('img').attr('src'));
  assert.equal(uri.getQueryParamValue('fit'), 'min');
  assert.equal(uri.getQueryParamValue('crop'), 'top,left');
});

test('it respects `crop` and `fit` values passed as attributes', function(assert) {
  assert.expect(2);
  this.render(
    hbs`{{imgix-image path="/users/1.png" crop="top,left" fit="min"}}`
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
  this.render(hbs`{{imgix-image path="/users/1.png" alt="User 1"}}`);

  let alt = this.$('img').attr('alt');
  assert.equal(alt, 'User 1');
});

test('it allows passing ANY imgix parameter as an option hash', function(assert) {
  assert.expect(2);
  this.render(
    hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' options=(hash exp=20 invert=true)}}</div>`
  );

  let uri = new URI(this.$('img').attr('src'));

  assert.equal(uri.getQueryParamValue('exp'), 20);
  assert.equal(uri.getQueryParamValue('invert'), 'true');
});

test('attribute bindings: the draggable argument will set the draggable attribute on the image element', function(assert) {
  assert.expect(1);

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

test('attribute bindings: the alt argument will set the alt attribute on the image element', function(assert) {
  assert.expect(1);

  this.render(
    hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' alt='Photo of User 1'}}</div>`
  );

  assert.equal(this.$('img').attr('alt'), 'Photo of User 1');
});
