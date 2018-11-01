/* global Ember global */
import { module, test } from 'qunit';

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

  module('aspect ratio', function() {
    module(`valid ARs`, function() {
      const testValidAR = ({ ar, arDecimal }) => {
        test(`it generates the correct srcset heights for a valid AR (${ar})`, async function(assert) {
          const removeFallbackSrcSet = srcSets => srcSets.slice(0, -1);
          const content = Ember.HTMLBars.compile(
            `<div>{{imgix-image path="/users/1.png" options=(hash ar="${ar}")}}</div>`
          );
          await render(content);
          const srcSet = this.$('img').attr('srcset');
          const srcSets = srcSet.split(',').map(v => v.trim());
          const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
          removeFallbackSrcSet(srcSetUrls).forEach(srcSetUrl => {
            const srcSetURI = new URI(srcSetUrl);
            const w = srcSetURI.getQueryParamValue('w');
            const h = srcSetURI.getQueryParamValue('h');
            assert.equal(h, Math.ceil(w / arDecimal));
            assert.ok(w);
            assert.ok(h);
          });
        });
      };
      [
        ['1:1', '1'],
        ['1.1:1', '1.1'],
        ['1.12:1', '1.12'],
        ['1.123:1', '1.123'],
        ['1:1.1', '0.9090909090909091'],
        ['1:1.12', '0.8928571428571428'],
        ['1.1:1.1', '1'],
        ['1.123:1.123', '1'],
        ['11.123:11.123', '1']
      ].forEach(([validAR, validARDecimal]) =>
        testValidAR({
          ar: validAR,
          arDecimal: validARDecimal
        })
      );

      test(`it generates the correct srcset heights for a valid AR using the deprecated aspectRatio option`, async function(assert) {
        const ar = 1.1;
        const arDecimal = '1.1';
        const removeFallbackSrcSet = srcSets => srcSets.slice(0, -1);
        const content = Ember.HTMLBars.compile(
          `<div>{{imgix-image path="/users/1.png" aspectRatio=${ar}}}</div>`
        );
        await render(content);
        const srcSet = this.$('img').attr('srcset');
        const srcSets = srcSet.split(',').map(v => v.trim());
        const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
        removeFallbackSrcSet(srcSetUrls).forEach(srcSetUrl => {
          const srcSetURI = new URI(srcSetUrl);
          const w = srcSetURI.getQueryParamValue('w');
          const h = srcSetURI.getQueryParamValue('h');
          assert.equal(h, Math.ceil(w / arDecimal));
          assert.ok(w);
          assert.ok(h);
        });
      });
    });

    module('invalid ARs', function() {
      const testInvalidAR = ar => {
        test(`height should not be set when an invalid aspectRatio (${ar}) is passed`, async function(assert) {
          const oldConsole = global.console;
          global.console = { warn: () => {} };

          const removeFallbackSrcSet = srcSets => srcSets.slice(0, -1);

          const content = Ember.HTMLBars.compile(
            `<div>{{imgix-image path="/users/1.png" options=(hash ar="${ar}")}}</div>`
          );
          await render(content);

          const srcSet = this.$('img').attr('srcset');
          const srcSets = srcSet.split(',').map(v => v.trim());
          const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
          removeFallbackSrcSet(srcSetUrls).forEach(srcSetUrl => {
            const srcSetURI = new URI(srcSetUrl);
            const w = srcSetURI.getQueryParamValue('w');
            const h = srcSetURI.getQueryParamValue('h');

            assert.ok(w);
            assert.notOk(h);
          });

          global.console = oldConsole;
        });
      };

      ['4x3', '4:', 'blah:1:1', 'blah1:1', '1x1', '1:1blah', '1:blah1'].forEach(
        invalidAR => testInvalidAR(invalidAR)
      );
    });

    test('srcsets should not have a height set when aspectRatio is not set', async function(assert) {
      await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

      const srcSet = this.$('img').attr('srcset');
      const srcSets = srcSet.split(',').map(v => v.trim());
      const srcSetUrls = srcSets.map(srcSet => srcSet.split(' ')[0]);
      srcSetUrls.forEach(srcSetUrl => {
        const srcSetURI = new URI(srcSetUrl);
        const h = srcSetURI.getQueryParamValue('h');
        assert.notOk(h);
      });
    });

    test('the generated src should not have ar included', async function(assert) {
      await render(
        hbs`<div>{{imgix-image path="/users/1.png" options=(hash ar="2:1")}}</div>`
      );

      expectSrcsTo(this.$, (_, uri) => {
        assert.notOk(uri.getQueryParamValue('ar'));
      });
    });

    module('fixed dimensions', function() {
      test(`it generates the correct image height when a width and ar are passed`, async function(assert) {
        await render(
          hbs`<div>{{imgix-image path="/users/1.png" options=(hash ar="2:1") width=200 }}</div>`
        );

        expectSrcsTo(this.$, (_, urlURI) => {
          assert.equal(urlURI.getQueryParamValue('h'), 100);
        });
      });
      test(`it generates the correct image width when a height and ar are passed`, async function(assert) {
        await render(
          hbs`<div>{{imgix-image path="/users/1.png" options=(hash ar="2:1") height=200 }}</div>`
        );

        expectSrcsTo(this.$, (_, urlURI) => {
          assert.equal(urlURI.getQueryParamValue('w'), 400);
        });
      });
    });
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
  // Should work for both w-type srcsets and dpr srcsets
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
