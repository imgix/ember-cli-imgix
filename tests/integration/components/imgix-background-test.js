/* global Ember Promise global */
import { module, test } from 'qunit';

import targetWidths from 'ember-cli-imgix/common/targetWidths';
import ImgixBG from 'ember-cli-imgix/components/imgix-bg';

import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import { assign } from '@ember/polyfills';
import config from 'ember-get-config';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';

const isIE = (() => {
  const ua = window.navigator.userAgent;
  const isIE = /MSIE|Trident/.test(ua);
  return isIE;
})();

const findURI = () => {
  const container = find('.imgix-bg');

  if (!container) {
    throw new Error('Cannot find container.');
  }

  const bgImageStyle = container.style;

  if (!bgImageStyle.backgroundImage) {
    throw new Error(
      "Cannot find style.background-image on background div. The element probably hasn't had time to measure the size of the DOM element."
    );
  }

  const bgImageSrc = (() => {
    const bgImage = bgImageStyle.backgroundImage;
    // Mobile Safari trims speech marks from url('') styles, so this checks if they've been trimmed or not
    if (bgImage.startsWith('url("') || bgImage.startsWith("url('")) {
      return bgImageStyle.backgroundImage.slice(5, -2);
    }
    return bgImageStyle.backgroundImage.slice(4, -1);
  })();

  const bgImageSrcURI = new URI(bgImageSrc);
  return bgImageSrcURI;
};

const shouldHaveDimensions = async (
  assert,
  { width: expectedWidth, height: expectedHeight },
  markup
) => {
  await render(markup);

  const bgImageSrcURL = findURI();

  assert.equal(bgImageSrcURL.getQueryParamValue('w'), '' + expectedWidth);
  assert.equal(bgImageSrcURL.getQueryParamValue('h'), '' + expectedHeight);
};

const renderAndCallbackBeforeImageLoad = async function (markup) {
  let resolve;

  // Overriding didInsertElement to stop DOM measuring and subsequent rendering
  this.owner.register(
    'component:imgix-bg',
    ImgixBG.extend({
      didInsertElement() {
        resolve();
        this._super(...arguments);
      },
    })
  );

  render(markup);

  return new Promise((_resolve) => {
    resolve = _resolve;
  });
};

const shouldRenderNoBGImage = async function (assert, markup) {
  await renderAndCallbackBeforeImageLoad.call(this, markup);

  const container = find('.imgix-bg');
  const bgImage = container.style.backgroundImage;

  assert.ok(!bgImage.includes('url'));
};

const findClosestWidthFromTargetWidths = (targetWidth) =>
  targetWidths.reduce((acc, value) => {
    // <= ensures that the largest value is used
    if (Math.abs(value - targetWidth) <= Math.abs(acc - targetWidth)) {
      return value;
    }
    return acc;
  }, Number.MAX_VALUE);

module('Integration | Component | imgix background', function (hooks) {
  setupRenderingTest(hooks);

  test(`renders a div`, async function (assert) {
    await render(hbs`
    {{#imgix-bg path="/users/1.png"}}Content{{/imgix-bg}}`);

    assert.ok(this.$('div'));
  });

  module(`when neither width nor height are passed`, () => {
    test(`renders nothing at first`, async function (assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png"}}Content{{/imgix-bg}}`
      );
    });
    test(`sets the size of the background image to the size of the containing element`, async function (assert) {
      const targetWidth = 105;
      const targetHeight = 110;
      const aspectRatio = targetWidth / targetHeight;
      await render(
        Ember.HTMLBars.compile(`<div>
          <style
          >.imgix-bg { width: ${targetWidth}px; height: ${targetHeight}px}</style>
          {{#imgix-bg path="/users/1.png"}}Content{{/imgix-bg}}
        </div>`)
      );

      const bgImageSrcURL = findURI();

      const expectedWidth = findClosestWidthFromTargetWidths(targetWidth);
      const expectedHeight = Math.round(expectedWidth / aspectRatio);

      assert.equal(bgImageSrcURL.getQueryParamValue('w'), `${expectedWidth}`);
      assert.equal(bgImageSrcURL.getQueryParamValue('h'), `${expectedHeight}`);
      assert.equal(bgImageSrcURL.getQueryParamValue('fit'), 'crop');
    });
  });
  module('when both width and height provided', () => {
    test('renders immediately when both width and height provided', async function (assert) {
      await renderAndCallbackBeforeImageLoad.call(
        this,
        hbs`
        {{#imgix-bg
          path="/users/1.png"
          width=300
          height=350
        }}
          Content
        {{/imgix-bg}}`
      );

      const bgImageSrcURL = findURI();

      assert.equal(bgImageSrcURL.getQueryParamValue('w'), '300');
      assert.equal(bgImageSrcURL.getQueryParamValue('h'), '350');
    });
    test('sets width and height to values passed', async function (assert) {
      await render(hbs`
          <div>
            <style>.imgix-bg { width: 200px; height: 250px; }</style>
            {{#imgix-bg
              path="/users/1.png"
              width=300
              height=350
            }}
              Content
            {{/imgix-bg}}
          </div>
          `);

      const bgImageSrcURL = findURI();

      assert.equal(bgImageSrcURL.getQueryParamValue('w'), '300');
      assert.equal(bgImageSrcURL.getQueryParamValue('h'), '350');
    });
  });

  module('when only width is passed', () => {
    test('renders nothing at first', async function (assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png" width=200}}Content{{/imgix-bg}}`
      );
    });
    test('sets height dynamically', async function (assert) {
      await shouldHaveDimensions(
        assert,
        { width: 200, height: 210 },
        hbs`<div>
          <style>.imgix-bg { width: 100px; height: 105px}</style>
          {{#imgix-bg
            path="/users/1.png"
            width=200
          }}
            Content
          {{/imgix-bg}}
        </div>`
      );
    });
  });
  module('when only height is passed', () => {
    test('renders nothing at first', async function (assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png" height=200}}Content{{/imgix-bg}}`
      );
    });
    test('sets width dynamically', async function (assert) {
      await shouldHaveDimensions(
        assert,
        { width: 200, height: 210 },
        hbs`<div>
          <style>.imgix-bg { width: 100px; height: 105px}</style>
          {{#imgix-bg
            path="/users/1.png"
            height=210
          }}
            Content
          {{/imgix-bg}}
        </div>`
      );
    });
  });

  test('scales the background image by the devices dpr', async function (assert) {
    // window.devicePixelRatio is not allowed in IE.
    if (isIE) {
      return;
    }
    const oldDPR = global.devicePixelRatio;
    global.devicePixelRatio = 2;

    await render(
      hbs`
        <div>
          <style>.imgix-bg { width: 10px; height: 10px; }</style>
          {{#imgix-bg
            path="/users/1.png"
          }}
            Content
          {{/imgix-bg}}
        </div>
          `
    );

    const bgImageSrcURL = findURI();

    assert.equal(bgImageSrcURL.getQueryParamValue('dpr'), '2');

    global.devicePixelRatio = oldDPR;
  });

  test('the dpr can be overriden', async function (assert) {
    // IE doesn't allow us to override window.devicePixelRatio
    if (isIE) {
      return;
    }
    const oldDPR = global.devicePixelRatio;
    global.devicePixelRatio = 2;

    await render(
      hbs`
      <div>
        <style>.imgix-bg { width: 10px; height: 10px; }</style>
        {{#imgix-bg
          path="/users/1.png"
          options=(hash
            dpr=3
          )
        }}
          Content
        {{/imgix-bg}}
      </div>
      `
    );

    const bgImageSrcURL = findURI();

    assert.equal(bgImageSrcURL.getQueryParamValue('dpr'), '3');

    global.devicePixelRatio = oldDPR;
  });

  test(`the dpr is rounded to 2dp`, async function (assert) {
    await render(hbs`
        <div>
          <style>.imgix-bg { width: 10px; height: 10px; }</style>
          {{#imgix-bg
            path="/users/1.png"
            options=(hash
              dpr=3.4444
            )
          }}
            Content
          {{/imgix-bg}}
        </div>
          `);

    const bgImageSrcURL = findURI();

    assert.equal(bgImageSrcURL.getQueryParamValue('dpr'), '3.44');
  });

  test(`can pass alt to component`, async function (assert) {
    await render(hbs`
    {{#imgix-bg path="1.png" alt="Test alt"}}
    Content
    {{/imgix-bg}}
    `);

    assert.dom('.imgix-bg').hasAttribute('alt', 'Test alt');
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
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
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
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
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
      test('it allows overriding the default class via config', async function (assert) {
        assert.expect(1);

        config.APP.imgix.classNames = 'imgix-is-rad';

        await render(
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
        );

        assert.dom('div').hasClass('imgix-is-rad');
      });

      test('the default class given to the rendered element is `imgix-bg`', async function (assert) {
        assert.expect(1);

        await render(
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
        );

        assert.dom('div').hasClass('imgix-bg');
      });
    });

    module('library param', function () {
      test('it adds the library param to all srcs by default', async function (assert) {
        await render(
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
        );

        expectSrcsTo(this.$, (_, uri) => assert.ok(uri.hasQueryParam('ixlib')));
      });

      test('it allows disabling the imigx library param via conifg', async function (assert) {
        config.APP.imgix.disableLibraryParam = true;

        await render(
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
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
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
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
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png"
              options=(hash
                auto='format'
              )
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
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
          hbs`
          <div>
            <style>.imgix-bg { width: 1250px; height: 200px;}</style>
            {{#imgix-bg
              path="/users/1.png?auto=format"
            }}
              Content
            {{/imgix-bg}}
          </div>
          `
        );

        expectSrcsTo(this.$, (_, uri) =>
          assert.equal(uri.getQueryParamValue('auto'), 'format')
        );
      });
    });
  });
});

// matcher should be in the form (url: string, uri: URI) => boolean
// Should work for both w-type srcsets and dpr srcsets
function expectSrcsTo($, matcher) {
  const div = $('div').find('.imgix-bg').attr('style');
  const src = div.split("'")[1];
  matcher(src, new URI(src));
}
