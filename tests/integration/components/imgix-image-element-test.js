import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

/* global URI */

moduleForComponent('imgix-image-element', 'Integration | Component | imgix image element', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  this.render(hbs`{{imgix-image-element path="/users/1.png"}}`);

  let url = URI(this.$('img').attr('src'));
  assert.equal(this.$().text().trim(), '');
  assert.equal(url.pathname(), '/users/1.png');
});

test('it allows setting the alt attribute', function(assert) {

  this.render(hbs`{{imgix-image-element path="/users/1.png" alt="User 1"}}`);

  let alt = this.$('img').attr('alt');
  assert.equal(alt, 'User 1');
});
