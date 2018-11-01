import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { tryInvoke } from '@ember/utils';
import config from 'ember-get-config';
import EmberError from '@ember/error';
import ImgixClient from 'imgix-core-js';
import URI from 'jsuri';
import { debounce } from '@ember/runloop';
import { constants, targetWidths } from '../common';
import { deprecate } from '@ember/application/deprecations';

/**
 * Parse an aspect ratio in the format w:h to a decimal. If false is returned, the aspect ratio is in the wrong format.
 */
function parseAspectRatio(aspectRatio) {
  if (typeof aspectRatio !== 'string') {
    return false;
  }
  const isValidFormat = str => /^\d+(\.\d+)?:\d+(\.\d+)?$/.test(str);
  if (!isValidFormat(aspectRatio)) {
    return false;
  }

  const [width, height] = aspectRatio.split(':');

  return parseFloat(width) / parseFloat(height);
}

const attributeMap = {
  src: 'src',
  srcset: 'srcset',
  sizes: 'sizes',
  ...(get(config, 'APP.imgix.attributeNameMap') || {})
};

const buildDebugParams = ({ width, height }) => {
  return {
    txt64: `${width != null ? width : 'auto'} x ${
      height != null ? height : 'auto'
    }`,
    txtalign: 'center,bottom',
    txtsize: 40,
    txtfont: 'Helvetica Neue',
    txtclr: 'ffffff',
    txtpad: 40,
    txtfit: 'max'
  };
};

export default Component.extend({
  tagName: 'img',
  classNames: get(config, 'APP.imgix.classNames') || 'imgix-image',
  attributeBindings: [
    'alt',
    'crossorigin',
    'draggable',
    `src:${attributeMap.src}`,
    `placeholderSrc:${attributeMap.src === 'src' ? '_src' : 'src'}`,
    `srcset:${attributeMap.srcset}`,
    `sizes:${attributeMap.sizes}`
  ],

  path: null, // The path to your image
  aspectRatio: null,
  crop: null,
  fit: 'crop',
  onLoad: null,
  onError: null,
  crossorigin: 'anonymous', // img element crossorigin attr
  alt: '', // img element alt attr
  draggable: true, // img element draggable attr
  options: {}, // arbitrary imgix options
  disableLibraryParam: false,

  width: null,
  height: null,
  sizes: null,
  disableSrcSet: false,
  placeholderPath: null,

  debounceRate: 400,

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

  _srcAndSrcSet: computed(
    'path',
    '_pathAsUri',
    'width',
    'height',
    'crop',
    'fit',
    'disableSrcSet',
    'aspectRatio',
    function() {
      const pathAsUri = get(this, '_pathAsUri');
      const shouldShowDebugParams = get(config, 'APP.imgix.debug');
      const debugParams = shouldShowDebugParams
        ? get(this, '_debugParams')
        : {};

      if (!get(this, 'path')) {
        return;
      }

      let theseOptions = {
        fit: get(this, 'fit')
      };
      const width = get(this, 'width');
      if (width != null) {
        theseOptions.w = width;
      }
      const height = get(this, 'height');
      if (height != null) {
        theseOptions.h = height;
      }

      const fixedDimensions = width != null || height != null;

      if (get(this, 'crop')) {
        theseOptions.crop = get(this, 'crop');
      }

      const imgixOptions = {
        ...get(this, 'options')
      };
      let aspectRatio = get(this, 'aspectRatio');
      if (imgixOptions.ar) {
        aspectRatio = imgixOptions.ar;
        delete imgixOptions.ar;
      }

      if (get(this, 'aspectRatio')) {
        deprecate(
          'aspectRatio as a option is deprecated in favour of passing `ar` as a direct parameter to imgix. aspectRatio will be removed in ember-cli-imgix@3.',
          false,
          {
            id: 'ember-cli-imgix/aspectRatio-deprecation',
            until: '3.0.0'
          }
        );
      }

      const options = {
        ...imgixOptions,
        ...debugParams,
        ...theseOptions,
        ...pathAsUri.queryPairs.reduce((memo, param) => {
          memo[param[0]] = param[1];
          return memo;
        }, {})
      };

      const client = get(this, '_client');
      const buildWithOptions = options =>
        client.buildURL(pathAsUri.path(), options);
      const src = buildWithOptions(options);

      let srcset = undefined;
      const disableSrcSet = get(this, 'disableSrcSet');
      if (!disableSrcSet) {
        if (fixedDimensions) {
          const buildWithDpr = dpr =>
            buildWithOptions({
              ...options,
              dpr
            });
          // prettier-ignore
          srcset = `${buildWithDpr(2)} 2x, ${buildWithDpr(3)} 3x, ${buildWithDpr(4)} 4x, ${buildWithDpr(5)} 5x`;
        } else {
          let showARWrongFormatWarning = false;
          const buildSrcSetPair = targetWidth => {
            const targetHeight = (() => {
              if (options.h) {
                return options.h;
              }

              const aspectRatioDecimal = parseAspectRatio(aspectRatio);
              if (aspectRatio != null && aspectRatioDecimal === false) {
                // false indicates invalid
                showARWrongFormatWarning = true;
              }
              if (aspectRatioDecimal && aspectRatioDecimal > 0) {
                return Math.ceil(targetWidth / aspectRatioDecimal);
              }

              return options.h;
            })();

            const debugParams = shouldShowDebugParams
              ? buildDebugParams({ width: targetWidth, height: targetHeight })
              : {};

            const urlOptions = {
              ...options,
              ...debugParams,
              w: targetWidth,
              ...(targetHeight ? { h: targetHeight } : {})
            };
            const url = buildWithOptions(urlOptions);
            return `${url} ${targetWidth}w`;
          };
          const addFallbackSrc = srcset => srcset.concat(src);
          srcset = addFallbackSrc(targetWidths.map(buildSrcSetPair)).join(', ');
          if (showARWrongFormatWarning) {
            // eslint-disable-next-line no-console
            console.warn(
              `[imgix] The aspect ratio passed ("${aspectRatio}") is not in the correct format. The correct format is "W:H".`
            );
          }
        }
      }

      return { src, srcset };
    }
  ),

  src: computed('_srcAndSrcSet', function() {
    return get(this, '_srcAndSrcSet.src');
  }),
  srcset: computed('_srcAndSrcSet', function() {
    return get(this, '_srcAndSrcSet.srcset');
  }),
  placeholderSrc: computed('placeholderPath', function() {
    if (attributeMap.src === 'src') {
      return null;
    }
    const client = get(this, '_client');
    const placeholderPathURI = new URI(get(this, 'placeholderPath'));
    const placeholderURL = client.buildURL(placeholderPathURI.path(), {
      ...placeholderPathURI.queryPairs.reduce((memo, param) => {
        memo[param[0]] = param[1];
        return memo;
      }, {})
    });
    return placeholderURL;
  }),

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

  _debugParams: computed('width', 'height', function() {
    const width = get(this, 'width');
    const height = get(this, 'height');

    return buildDebugParams({ width, height });
  })
});
