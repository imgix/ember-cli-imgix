import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import ResizeAware from 'ember-resize-aware/mixins/resize-aware';
import { tryInvoke } from '@ember/utils';
import config from 'ember-get-config';
import EmberError from '@ember/error';
import ImgixClient from 'imgix-core-js';
import URI from 'jsuri';
import { debounce } from '@ember/runloop';
import { toFixed, constants } from '../common';

export default Component.extend(ResizeAware, {
  tagName: 'img',
  classNames: 'imgix-image',
  attributeBindings: ['src', 'crossorigin', 'alt'],

  path: null, // The path to your image
  aspectRatio: null,
  crop: null,
  fit: 'crop',
  pixelStep: 10,
  onLoad: null,
  onError: null,
  crossorigin: 'anonymous',
  alt: '', // image alt
  options: {}, // arbitrary imgix options
  disableLibraryParam: false,

  width: null, // passed in
  height: null, // passed in

  _width: null,
  _height: null,
  _dpr: null,

  debounceRate: 400,

  didResize(width, height) {
    if (get(this, 'path')) {
      const newWidth =
        Math.ceil(
          get(this, '_pathAsUri').getQueryParamValue('w') ||
            width / get(this, 'pixelStep')
        ) * get(this, 'pixelStep');
      const newHeight = Math.floor(
        get(this, 'aspectRatio')
          ? newWidth / get(this, 'aspectRatio')
          : get(this, '_pathAsUri').getQueryParamValue('h') || height
      );
      const newDpr = toFixed(2, window.devicePixelRatio || 1);

      set(this, '_width', newWidth);
      set(this, '_height', newHeight);
      set(this, '_dpr', newDpr);
    }
  },

  didInsertElement(...args) {
    this._super(...args);

    if (get(this, 'onLoad')) {
      this._handleImageLoad = this._handleImageLoad.bind(this);
      this.element.addEventListener('load', this._handleImageLoad);
    }

    if (get(this, 'onError')) {
      this._handleImageError = this._handleImageError.bind(this);
      this.element.addEventListener('error', this._handleImageError);
    }

    this.didResize(
      get(this, 'width') ||
        get(this, '_width') ||
        this.element.clientWidth ||
        this.element.parentElement.clientWidth,
      get(this, 'height') ||
        get(this, '_height') ||
        this.element.clientHeight ||
        this.element.parentElement.clientHeight
    );
  },

  didUpdateAttrs(...args) {
    this._super(...args);

    if (typeof FastBoot === 'undefined') {
      this.didResize(
        get(this, 'width') ||
          get(this, '_width') ||
          this.element.clientWidth ||
          this.element.parentElement.clientWidth,
        get(this, 'height') ||
          get(this, '_height') ||
          this.element.clientHeight ||
          this.element.parentElement.clientHeight
      );
    }
  },

  willDestroyElement(...args) {
    if (get(this, 'onLoad') && typeof FastBoot === 'undefined') {
      this.element.removeEventListener('load', this._handleImageLoad);
    }

    if (get(this, 'onError') && typeof FastBoot === 'undefined') {
      this.element.removeEventListener('error', this._handleImageError);
    }

    this._super(...args);
  },

  _pathAsUri: computed('path', function() {
    if (!get(this, 'path')) {
      return false;
    }

    return new URI(get(this, 'path'));
  }),

  _client: computed('disableLibraryParam', function() {
    if (!config || !get(config, 'APP.imgix.source')) {
      throw new EmberError(
        'Could not find a source in the application configuration. Please configure APP.imgix.source in config/environment.js. See https://github.com/imgix/ember-cli-imgix for more information.'
      );
    }

    const disableLibraryParam =
      get(config, 'APP.imgix.disableLibraryParam') ||
      get(this, 'disableLibraryParam');

    return new ImgixClient({
      host: config.APP.imgix.source,
      includeLibraryParam: false, // to disable imgix-core-js setting ixlib=js by default
      libraryParam: disableLibraryParam
        ? undefined
        : `ember-${constants.APP_VERSION}`
    });
  }),

  src: computed(
    'path',
    '_pathAsUri',
    '_width',
    '_height',
    '_dpr',
    'crop',
    'fit',
    function() {
      const pathAsUri = get(this, '_pathAsUri');
      const debugParams = get(config, 'APP.imgix.debug') ? get(this, '_debugParams') : {};

      if (!get(this, '_width')) {
        return;
      }
      if (!get(this, 'path')) {
        return;
      }

      let theseOptions = {
        dpr: get(this, '_dpr'),
        fit: get(this, 'fit'),
        h: get(this, '_height'),
        w: get(this, '_width'),
      };

      if (get(this, 'crop')) {
        theseOptions.crop = get(this, 'crop');
      }

      const options = {
        ...get(this, 'options'),
        ...debugParams,
        ...theseOptions,
        ...pathAsUri.queryPairs.reduce((memo, param) => {
          memo[param[0]] = param[1];
          return memo;
        }, {}),
      };

      return get(this, '_client').buildURL(
        get(this, '_pathAsUri').path(),
        options
      );
    }
  ),

  _handleImageLoad(event) {
    debounce(
      this,
      () => !get(this, 'isDestroyed') && tryInvoke(this, 'onLoad', [event]),
      500
    );
  },

  _handleImageError(event) {
    debounce(
      this,
      () => !get(this, 'isDestroyed') && tryInvoke(this, 'onError', [event]),
      500
    );
  },

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
      txtfit: 'max'
    };
  })
});
