import { module, test } from 'qunit';

import { setupRenderingTest } from 'ember-qunit';
import { compileTemplate } from '@ember/template-compilation';
import { render, find } from '@ember/test-helpers';
import { assign } from '@ember/polyfills';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';
import config from 'ember-get-config';

module('Integration | Component | imgix image', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders an image', async function (assert) {
    await render(hbs`{{imgix-image path="/users/1.png"}}`);
    assert.ok(this.$('img'));
  });

  test('it does not throw an exception when given an undefined path', async function (assert) {
    await render(hbs`{{imgix-image}}`);
    assert.notEqual(this.element.querySelector('img'), null);
  });

  test(`the rendered image's srcs have the correct path`, async function (assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.path(), '/users/1.png');
    });
  });

  test(`the rendered image's srcs have the correct host`, async function (assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(config.APP.imgix.source, uri.host());
      assert.equal(uri.protocol(), 'https');
    });
  });

  test(`the image's srcs have the fit parameter set to crop by default`, async function (assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'crop');
    });
  });

  test(`the image's srcs contains an query parameters passed in via the 'path' attribute`, async function (assert) {
    await render(hbs`<div>{{imgix-image path="/users/1.png?sat=100"}}</div>`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('sat'), '100');
    });
  });

  module('aspect ratio', function () {
    module(`valid ARs`, function () {
      const testValidAR = ({ ar }) => {
        test(`it generates an ar parameter for a valid AR (${ar})`, async function (assert) {
          const removeFallbackSrcSet = (srcSets) => srcSets.slice(0, -1);
          const content = compileTemplate(
            `<div>{{imgix-image path="/users/1.png" options=(hash ar="${ar}")}}</div>`
          );
          await render(content);
          const srcSet = find('img').getAttribute('srcset');
          const srcSets = srcSet.split(',').map((v) => v.trim());
          const srcSetUrls = srcSets.map((srcSet) => srcSet.split(' ')[0]);
          removeFallbackSrcSet(srcSetUrls).forEach((srcSetUrl) => {
            const srcSetURI = new URI(srcSetUrl);
            const w = srcSetURI.getQueryParamValue('w');
            const ar = srcSetURI.getQueryParamValue('ar');
            assert.ok(w);
            assert.ok(ar);
          });
        });
      };
      [
        ['1:1'],
        ['1.1:1'],
        ['1.12:1'],
        ['1.123:1'],
        ['1:1.1'],
        ['1:1.12'],
        ['1.1:1.1'],
        ['1.123:1.123'],
        ['11.123:11.123'],
      ].forEach((validAR) =>
        testValidAR({
          ar: validAR,
        })
      );
    });

    module('invalid ARs', function () {
      const testInvalidAR = (ar) => {
        test(`height should not be set when an invalid aspectRatio (${ar}) is passed`, async function (assert) {
          const oldConsole = global.console;
          global.console = { warn: () => {} };

          const removeFallbackSrcSet = (srcSets) => srcSets.slice(0, -1);

          const content = compileTemplate(
            `<div>{{imgix-image path="/users/1.png" options=(hash ar="${ar}")}}</div>`
          );
          await render(content);

          const srcSet = find('img').getAttribute('srcset');
          const srcSets = srcSet.split(',').map((v) => v.trim());
          const srcSetUrls = srcSets.map((srcSet) => srcSet.split(' ')[0]);
          removeFallbackSrcSet(srcSetUrls).forEach((srcSetUrl) => {
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
        (invalidAR) => testInvalidAR(invalidAR)
      );
    });

    test('srcsets should not have a height set when aspectRatio is not set', async function (assert) {
      await render(hbs`<div>{{imgix-image path="/users/1.png"}}</div>`);

      const srcSet = find('img').getAttribute('srcset');
      const srcSets = srcSet.split(',').map((v) => v.trim());
      const srcSetUrls = srcSets.map((srcSet) => srcSet.split(' ')[0]);
      srcSetUrls.forEach((srcSetUrl) => {
        const srcSetURI = new URI(srcSetUrl);
        const h = srcSetURI.getQueryParamValue('h');
        assert.notOk(h);
      });
    });

    test('the generated src should have ar included', async function (assert) {
      await render(
        hbs`<div>{{imgix-image path="/users/1.png" options=(hash ar="2:1")}}</div>`
      );

      expectSrcsTo(this.$, (_, uri) => {
        assert.ok(uri.getQueryParamValue('ar'));
      });
    });

    module('fixed dimensions', function () {
      test(`it generates an ar parameter when passed as an option`, async function (assert) {
        await render(
          hbs`<div>{{imgix-image path="/users/1.png" options=(hash ar="2:1") height=200 }}</div>`
        );

        expectSrcsTo(this.$, (_, urlURI) => {
          assert.equal(urlURI.getQueryParamValue('ar'), '2:1');
        });
      });
    });
  });

  test(`it respects the width and height passed in`, async function (assert) {
    await render(hbs`{{imgix-image path="/users/1.png" width=100 height=200}}`);

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('w'), '100');
      assert.equal(uri.getQueryParamValue('h'), '200');
    });
  });

  test(`it respects passed in 'crop' and 'fit' values`, async function (assert) {
    await render(
      hbs`{{imgix-image path="/users/1.png?sat=100&fit=min&crop=top,left"}}`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'min');
      assert.equal(uri.getQueryParamValue('crop'), 'top,left');
    });
  });

  test(`it respects 'crop' and 'fit' values passed as attributes`, async function (assert) {
    await render(
      hbs`{{imgix-image path="/users/1.png" crop="top,left" fit="min"}}`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('fit'), 'min');
      assert.equal(uri.getQueryParamValue('crop'), 'top,left');
    });
  });

  test(`it allows setting the 'alt' attribute`, async function (assert) {
    await render(hbs`{{imgix-image path="/users/1.png" alt="User 1"}}`);
    const alt = find('img').getAttribute('alt');

    assert.equal(alt, 'User 1');
  });

  test('it allows passing ANY imgix parameter as an option hash', async function (assert) {
    await render(
      hbs`<div>{{imgix-image path='/users/1.png' options=(hash exp=20 invert=true)}}</div>`
    );

    expectSrcsTo(this.$, (_, uri) => {
      assert.equal(uri.getQueryParamValue('exp'), 20);
      assert.equal(uri.getQueryParamValue('invert'), 'true');
    });
  });

  test('attribute bindings: the draggable argument will set the draggable attribute on the image element', async function (assert) {
    await render(
      hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' draggable=false}}</div>`
    );

    assert.dom('img').hasAttribute('draggable', 'false');
  });

  test('attribute bindings: the crossorigin argument will set the crossorigin attribute on the image element', async function (assert) {
    assert.expect(1);

    await render(
      hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' crossorigin='imgix-is-rad'}}</div>`
    );

    assert.dom('img').hasAttribute('crossorigin', 'imgix-is-rad');
  });

  module('application config', function (hooks) {
    hooks.beforeEach(function () {
      this.initialAppConfig = assign({}, config.APP.imgix);
    });

    hooks.afterEach(function () {
      config.APP.imgix = this.initialAppConfig;
    });

    module('debug params', function () {
      test('it does not render debug params when passing debug false', async function (assert) {
        config.APP.imgix.debug = false;

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
        );

        const debugParams = [
          'txtalign',
          'txtclr',
          'txtfit',
          'txtfont',
          'txtpad',
          'txtsize',
        ];

        expectSrcsTo(this.$, (_, uri) =>
          debugParams.forEach((debugParam) =>
            assert.notOk(uri.hasQueryParam(debugParam))
          )
        );
      });

      test('it will render debug params when passing debug true', async function (assert) {
        config.APP.imgix.debug = true;

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
        );

        const debugParams = [
          'txtalign',
          'txtclr',
          'txtfit',
          'txtfont',
          'txtpad',
          'txtsize',
        ];

        expectSrcsTo(this.$, (_, uri) =>
          debugParams.forEach((debugParam) =>
            assert.ok(uri.hasQueryParam(debugParam))
          )
        );
      });
    });

    module('default css class', function () {
      test('it allows setting overriding the default class via config', async function (assert) {
        assert.expect(1);

        config.APP.imgix.classNames = 'imgix-is-rad';

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
        );

        assert.dom('img').hasClass('imgix-is-rad');
      });

      test('the default class given to the rendered element is `imgix-image`', async function (assert) {
        assert.expect(1);

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png'}}</div>`
        );

        assert.dom('img').hasClass('imgix-image');
      });
    });

    module('library param', function () {
      test('it adds the library param to all srcs by default', async function (assert) {
        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
        );

        expectSrcsTo(this.$, (_, uri) => assert.ok(uri.hasQueryParam('ixlib')));
      });

      test('it allows disabling the imigx library param via conifg', async function (assert) {
        config.APP.imgix.disableLibraryParam = true;

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' }}</div>`
        );

        expectSrcsTo(this.$, (_, uri) =>
          assert.notOk(uri.hasQueryParam('ixlib'))
        );
      });
    });

    module('default params from app config', function () {
      test('are respected ', async function (assert) {
        config.APP.imgix.defaultParams = {
          toBoop: 'the-snoot',
        };

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png'}}</div>`
        );

        expectSrcsTo(this.$, (_, uri) =>
          assert.equal(uri.getQueryParamValue('toBoop'), 'the-snoot')
        );
      });

      test('`options` attr takes precedence', async function (assert) {
        config.APP.imgix.defaultParams = {
          auto: 'faces',
        };

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png' options=(hash
            auto='format'
          )}}</div>`
        );

        expectSrcsTo(this.$, (_, uri) =>
          assert.equal(uri.getQueryParamValue('auto'), 'format')
        );
      });

      test('params on the path take precedence', async function (assert) {
        config.APP.imgix.defaultParams = {
          auto: 'faces',
        };

        await render(
          hbs`<div style='width:1250px;height:200px;'>{{imgix-image path='/users/1.png?auto=format'}}</div>`
        );

        expectSrcsTo(this.$, (_, uri) =>
          assert.equal(uri.getQueryParamValue('auto'), 'format')
        );
      });
    });
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
    const srcSets = srcSet.split(',').map((v) => v.trim());
    const srcSetUrls = srcSets.map((srcSet) => srcSet.split(' ')[0]);
    srcSetUrls.forEach((srcSetUrl) => {
      matcher(srcSetUrl, new URI(srcSetUrl));
    });
  }
});
