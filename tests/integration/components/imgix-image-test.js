import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';


moduleForComponent('imgix-image', 'Integration | Component | imgix image', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png"}}`);

  assert.equal(this.$().text().trim(), '');
  assert.equal(this.$('img').length, 1);
});

test('it renders the correct path', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png"}}`);

  assert.ok(this.$('img').attr('src').indexOf("https://assets.imgix.net/users/1.png") > -1);
  assert.ok(this.$('img').attr('src').indexOf("w=1280") > -1);
});

test('it renders with an aspect ratio', function(assert) {
  this.render(hbs`{{imgix-image path="/users/1.png" aspectRatio=1.3333}}`);

  assert.equal(this.$().text().trim(), '');
  assert.ok(this.$('img').attr('src').indexOf("w=1280") > -1);
  assert.ok(this.$('img').attr('src').indexOf("h=960&") > -1);
});