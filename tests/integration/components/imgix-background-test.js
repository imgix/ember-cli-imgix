/* global Ember Promise global */
import { module, test, skip } from 'qunit';

import targetWidths from 'ember-cli-imgix/common/targetWidths';
import ImgixBG from 'ember-cli-imgix/components/imgix-bg';

import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import URI from 'jsuri';
// import config from 'ember-get-config';
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
  console.log('bgImageStyle', bgImageStyle);

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

  console.log(
    "find('.imgix-bg').getBoundingClientRect()",
    find('.imgix-bg').getBoundingClientRect()
  );

  const bgImageSrcURL = findURI();

  assert.equal(bgImageSrcURL.getQueryParamValue('w'), '' + expectedWidth);
  assert.equal(bgImageSrcURL.getQueryParamValue('h'), '' + expectedHeight);
};

const renderBGAndWaitUntilLoaded = async markup => {
  return new Promise(async (resolve, reject) => {
    let waitUntilHasStyle = (maxTimes = 20, delay = 10, n = 0) => {
      // Find the element which has the class "bg-img"
      const bgImageEl = find('.imgix-bg');
      // Check if the element has loaded, which is shown by a truthy `background-image`
      console.log('bgImageEl', bgImageEl.getAttribute('style'));
      console.log(
        'bgImageEl.style.backgroundImage',
        bgImageEl.style.backgroundImage
      );
      if (bgImageEl.style.backgroundImage) {
        return resolve(find('.imgix-bg'));
      }

      if (n >= maxTimes) {
        return reject('Tries exceeded to wait for component to be ready');
      }
      setTimeout(() => waitUntilHasStyle(maxTimes, delay, n + 1), delay);
    };

    await render(markup);
    setTimeout(waitUntilHasStyle, 10);
  });
};

const renderAndCallbackBeforeImageLoad = async function(markup) {
  let resolve, reject;

  // Overriding didInsertElement to stop DOM measuring and subsequent rendering
  this.owner.register(
    'component:imgix-bg',
    ImgixBG.extend({
      didInsertElement() {
        resolve();
        this._super(...arguments);
      }
    })
  );

  render(markup);

  return new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
};

const shouldRenderNoBGImage = async function(assert, markup) {
  await renderAndCallbackBeforeImageLoad.call(this, markup);

  const container = find('.imgix-bg');
  const bgImage = container.style.backgroundImage;

  assert.ok(!bgImage.includes('url'));
};

const findClosestWidthFromTargetWidths = targetWidth =>
  targetWidths.reduce((acc, value) => {
    // <= ensures that the largest value is used
    if (Math.abs(value - targetWidth) <= Math.abs(acc - targetWidth)) {
      return value;
    }
    return acc;
  }, Number.MAX_VALUE);

module('Integration | Component | imgix background', function(hooks) {
  setupRenderingTest(hooks);

  test(`renders a div`, async function(assert) {
    await render(hbs`
    {{#imgix-bg path="/users/1.png"}}Content{{/imgix-bg}}`);

    assert.ok(this.$('div'));
  });

  module(`when neither width nor height are passed`, () => {
    test(`renders nothing at first`, async function(assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png"}}Content{{/imgix-bg}}`
      );
    });
    test(`sets the size of the background image to the size of the containing element`, async function(assert) {
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
    test('renders immediately when both width and height provided', async function(assert) {
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

      console.log('ASSERT');

      const bgImageSrcURL = findURI();

      assert.equal(bgImageSrcURL.getQueryParamValue('w'), '300');
      assert.equal(bgImageSrcURL.getQueryParamValue('h'), '350');
    });
    test('sets width and height to values passed', async function(assert) {
      const sut = await render(hbs`
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
    test('renders nothing at first', async function(assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png" width=200}}Content{{/imgix-bg}}`
      );
    });
    test('sets height dynamically', async function(assert) {
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
    test('renders nothing at first', async function(assert) {
      await shouldRenderNoBGImage.call(
        this,
        assert,
        hbs`{{#imgix-bg path="/users/1.png" height=200}}Content{{/imgix-bg}}`
      );
    });
    test('sets width dynamically', async function(assert) {
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

  test('scales the background image by the devices dpr', async function(assert) {
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

  test('the dpr can be overriden', async function(assert) {
    // IE doesn't allow us to override window.devicePixelRatio
    if (isIE) {
      return;
    }
    const oldDPR = global.devicePixelRatio;
    global.devicePixelRatio = 2;

    await render(hbs`
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
          `);

    const bgImageSrcURL = findURI();

    assert.equal(bgImageSrcURL.getQueryParamValue('dpr'), '3');

    global.devicePixelRatio = oldDPR;
  });

  test(`the dpr is rounded to 2dp`, async function(assert) {
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

  test(`can pass alt to component`, async function(assert) {
    await render(hbs`
    {{#imgix-bg path="1.png" alt="Test alt"}}
    Content
    {{/imgix-bg}}
    `);

    assert.equal(find('.imgix-bg').getAttribute('alt'), 'Test alt');
  });
});
