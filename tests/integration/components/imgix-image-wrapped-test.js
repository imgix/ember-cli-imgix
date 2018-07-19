import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

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

  let url = new URL(this.$('img').attr('src'));
  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );
  assert.equal(url.pathname, '/users/1.png');
});

test('it renders the correct path', function(assert) {
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);

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
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png"}}`);
  let url = new URL(this.$('img').attr('src'));

  assert.equal(url.searchParams.get('w'), '1250');
  assert.equal(url.pathname, '/users/1.png');
  assert.equal(url.searchParams.get('fit'), 'crop');
  assert.equal(url.searchParams.has('crop'), false);
});

test('it maintains any query parameters passed in', function(assert) {
  assert.expect(2);
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png?sat=100"}}`);

  let url = new URL(this.$('img').attr('src'));
  assert.equal(url.searchParams.get('sat'), '100');
  assert.equal(url.searchParams.get('w'), '1250');
});

test('it renders with an aspect ratio', function(assert) {
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" aspectRatio=1.3333}}`
  );

  assert.equal(
    this.$()
      .text()
      .trim(),
    ''
  );
  let url = new URL(this.$('img').attr('src'));

  assert.equal(url.searchParams.get('w'), '1250');
  assert.equal(url.searchParams.get('h'), '937');
});

test('it respects passed in `crop` and `fit` values', function(assert) {
  assert.expect(2);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
  );

  let url = new URL(this.$('img').attr('src'));
  assert.equal(url.searchParams.get('fit'), 'min');
  assert.equal(url.searchParams.get('crop'), 'top,left');
});

test('it respects `crop` and `fit` values passed as attributes', function(assert) {
  assert.expect(2);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" crop="top,left" fit="min"}}`
  );

  let url = new URL(this.$('img').attr('src'));
  assert.equal(url.searchParams.get('crop'), 'top,left');
  assert.equal(url.searchParams.get('fit'), 'min');
});

test('it respects `auto` values passed as attributes', function(assert) {
  assert.expect(1);
  this.render(
    hbs`{{imgix-image-wrapped path="/users/1.png" auto="compress,enhance"}}`
  );

  let url = new URL(this.$('img').attr('src'));
  assert.equal(url.searchParams.get('auto'), 'compress,enhance');
});

test('it allows setting the alt attribute', function(assert) {
  this.render(hbs`{{imgix-image-wrapped path="/users/1.png" alt="User 1"}}`);

  let alt = this.$('img').attr('alt');
  assert.equal(alt, 'User 1');
});
