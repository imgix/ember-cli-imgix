import Mixin from '@ember/object/mixin';
import EmberObject, { computed, get } from '@ember/object';
import { merge } from '@ember/polyfills';
import { schedule, debounce } from '@ember/runloop';
import { getOwner } from '@ember/application';
import EmberError from '@ember/error';
import ImgixClient from 'imgix-core-js';
import config from 'ember-get-config';
import { toFixed, constants } from '../common';

export default Mixin.create({
  crossorigin: null,
  aspectRatio: null,

  auto: null,
  crop: null,
  fit: null,

  pixelStep: 10,

  useParentWidth: false,

  /**
   * @public
   * @property {string} The main entry point for our component. The final `src` will be set based on a manipulation of this property.
   */
  path: null,

  /**
   * @private
   * @property {string} The computed path from the input path. This should not include any query parameters passed in, e.g. "/users/1.png?sat=100"
   */
  _path: computed('path', function() {
    let path = get(this, 'path');
    return path
      ? new window.URL(path, `https://${config.APP.imgix.source}`).pathname
      : '';
  }),

  /**
   * @private
   * @property {Object} a hash of key-value pairs for parameters that were passed in via the `path` property
   */
  _query: computed('path', function() {
    let path = get(this, 'path');
    let query = {};
    const searchParams = new window.URL(
      path,
      `https://${config.APP.imgix.source}`
    ).searchParams;
    for (let item of searchParams.entries()) {
      query[item[0]] = item[1];
    }
    return path ? EmberObject.create(query) : {};
  }),

  _widthFromPath: computed('_query', function() {
    return get(this, '_query.w');
  }),

  _heightFromPath: computed('_query', function() {
    return get(this, '_query.h');
  }),

  /**
   * @private
   * @default 0
   * @property {number} An internal counter to used to trigger resizes.
   */
  _resizeCounter: 0,

  /**
   * The main meat of our responsive imaging. We use an instance of ImgixClient to build up a new image
   * URL based on `path` and apply the correct sizing parameters as we go.
   *
   * @public
   * @property {string}
   * @return the fully built string
   */
  src: computed(
    '_path',
    '_query',
    '_width',
    '_height',
    '_dpr',
    'crop',
    'fit',
    function() {
      if (!get(this, '_width')) {
        return;
      }

      let env = get(this, '_config');

      // These operations are defaults and should be overidden by any incoming
      // query parameters
      let options = {
        fit: get(this, 'fit') || 'crop'
      };

      if (get(this, 'crop')) {
        merge(options, { crop: get(this, 'crop') });
      }

      if (get(this, 'auto')) {
        merge(options, { auto: get(this, 'auto') });
      }

      if (get(this, '_query')) {
        merge(options, get(this, '_query'));
      }

      if (!!env && get(env, 'APP.imgix.debug')) {
        merge(options, get(this, '_debugParams'));
      }

      // This is where the magic happens. These are the parameters that force the
      // responsiveness that we're looking for.
      merge(options, {
        w: get(this, '_width'),
        h: get(this, '_height'),
        dpr: get(this, '_dpr')
      });

      return get(this, '_client').buildURL(get(this, '_path'), options);
    }
  ),

  /**
   * Fire off a resize after our element has been added to the DOM.
   */
  didInsertElement: function() {
    schedule('afterRender', this, this._incrementResizeCounter);
  },

  /**
   * Observer to trigger image resizes, but debounced.
   * @private
   */
  didResize: function() {
    let debounceRate = 200;
    let env = get(this, '_config');
    if (!!env && !!get(env, 'APP.imgix.debounceRate')) {
      debounceRate = get(env, 'APP.imgix.debounceRate');
    }
    debounce(this, this._incrementResizeCounter, debounceRate);
  },

  /**
   * @property ImgixClient instantiated ImgixClient
   * @throws {EmberError} Will throw an error if the imgix config information is not found in config/environment.js
   * @return ImgixClient return an instantiated ImgixClient instance.
   */
  _client: computed(function() {
    let env = get(this, '_config');
    if (!env || !get(env, 'APP.imgix.source')) {
      throw new EmberError(
        'Could not find a source in the application configuration. Please configure APP.imgix.source in config/environment.js. See https://github.com/imgix/ember-cli-imgix for more information.'
      );
    }

    const disableLibraryParam =
      get(config, 'APP.imgix.disableLibraryParam') ||
      get(this, 'disableLibraryParam');

    return new ImgixClient({
      host: env.APP.imgix.source,
      includeLibraryParam: false, // to disable imgix-core-js setting ixlib=js by default
      libraryParam: disableLibraryParam
        ? undefined
        : `ember-${constants.APP_VERSION}`
    });
  }),

  /**
   * Increments an internal resize counter, which will trigger an image resize.
   *
   * @private
   * @method _incrementResizeCounter
   */
  _incrementResizeCounter: function() {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) {
      return;
    }
    this.incrementProperty('_resizeCounter');
  },

  /**
   * @property {Object}
   * @return {Object} a POJO with some extra imgix parameters to overlay debug data on our image.
   * @private
   */
  _debugParams: computed('_width', '_height', '_dpr', function() {
    return {
      txt64: `${get(this, '_width')} x ${get(this, '_height')} @ DPR ${get(
        this,
        '_dpr'
      )}`,
      txtalign: 'center,bottom',
      txtsize: 20,
      txtfont: 'Helvetica Neue',
      txtclr: 'ffffff',
      txtpad: 20,
      txtfit: 'max',
      exp: -2
    };
  }),

  /**
   * Width as computed by the child image element's clientWidth
   * @private
   * @property _width
   * @default 0
   */
  _width: computed('_resizeCounter', 'pixelStep', 'useParentWidth', function() {
    let newWidth = 0;

    if (get(this, 'useParentWidth') && get(this, 'element')) {
      newWidth = this.$()
        .parent()
        .outerWidth();
    }

    if (!newWidth) {
      newWidth =
        get(this, 'element.clientWidth') || get(this, '_widthFromPath');
    }
    let pixelStep = get(this, 'pixelStep');
    return Math.ceil(newWidth / pixelStep) * pixelStep;
  }),

  /**
   * Height as computed by the child image element's clientHeight
   * @private
   * @property _height
   * @default 0
   */
  _height: computed('aspectRatio', '_resizeCounter', '_width', function() {
    let newHeight = get(this, 'element.clientHeight') || 0;

    if (get(this, 'aspectRatio')) {
      newHeight = get(this, '_width') / get(this, 'aspectRatio');
    }

    return Math.floor(newHeight);
  }),

  /**
   * Device Pixel Ratio as reported by the client.
   * @private
   * @property _dpr
   * @return {Number} devicePixelRatio for the client
   * @default 1
   */
  _dpr: computed('_resizeCounter', function() {
    return toFixed(2, window.devicePixelRatio || 1);
  }),

  /**
   * Simple abstraction for reading the app's configuration. Useful for testing.
   * @private
   */
  _config: computed(function() {
    return getOwner(this).resolveRegistration('config:environment');
  })
});
