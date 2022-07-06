import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import config from 'ember-get-config';
import EmberError from '@ember/error';
import ImgixClient from '@imgix/js-core';
import URI from 'jsuri';
import { debounce } from '@ember/runloop';
import { constants, targetWidths } from '../common';

/**
 * Parse an aspect ratio in the format w:h to a decimal. If false is returned, the aspect ratio is in the wrong format.
 */
function isAspectRatioValid(aspectRatio) {
  if (typeof aspectRatio !== 'string') {
    return false;
  }

  return /^\d+(\.\d+)?:\d+(\.\d+)?$/.test(aspectRatio);
}

const attributeMap = {
  src: 'src',
  srcset: 'srcset',
  sizes: 'sizes',
  ...(config.APP.imgix.attributeNameMap || {}),
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
    txtfit: 'max',
  };
};

export default Component.extend({
  tagName: 'img',
  classNameBindings: ['elementClassNames'],
  attributeBindings: [
    'alt',
    'crossorigin',
    'draggable',
    `src:${attributeMap.src}`,
    `placeholderSrc:${attributeMap.src === 'src' ? '_src' : 'src'}`,
    `srcset:${attributeMap.srcset}`,
    `sizes:${attributeMap.sizes}`,
  ],

  path: null, // The path to your image
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

    if (this.onLoad) {
      this._handleImageLoad = this._handleImageLoad.bind(this);
      this.element.addEventListener('load', this._handleImageLoad);
    }

    if (this.onError) {
      this._handleImageError = this._handleImageError.bind(this);
      this.element.addEventListener('error', this._handleImageError);
    }
  },

  willDestroyElement(...args) {
    if (this.onLoad && typeof FastBoot === 'undefined') {
      this.element.removeEventListener('load', this._handleImageLoad);
    }

    if (this.onError && typeof FastBoot === 'undefined') {
      this.element.removeEventListener('error', this._handleImageError);
    }

    this._super(...args);
  },

  _pathAsUri: computed('path', function () {
    if (!this.path) {
      return false;
    }

    return new URI(this.path);
  }),

  _client: computed('disableLibraryParam', function () {
    if (!config || !config.APP.imgix.source) {
      throw new EmberError(
        'Could not find a source in the application configuration. Please configure APP.imgix.source in config/environment.js. See https://github.com/imgix/ember-cli-imgix for more information.'
      );
    }

    const disableLibraryParam =
      config.APP.imgix.disableLibraryParam || this.disableLibraryParam;

    return new ImgixClient({
      domain: config.APP.imgix.source,
      includeLibraryParam: false, // to disable @imgix/js-core setting ixlib=js by default
      libraryParam: disableLibraryParam
        ? undefined
        : `ember-${constants.APP_VERSION}`,
    });
  }),

  _srcAndSrcSet: computed(
    '_client',
    '_pathAsUri',
    'crop',
    'disableSrcSet',
    'fit',
    'height',
    'options',
    'path',
    'width',
    function () {
      // Warnings, checks
      if (!this.path) {
        return;
      }
      const widthProp = this.width;
      const heightProp = this.height;
      if (isDimensionInvalid(widthProp) || isDimensionInvalid(heightProp)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[imgix] Either the width or height passed to this component (w: ${widthProp}, h: ${heightProp}) was invalid. Both width and height need to be a number greater than 0, or undefined.`
        );
      }

      // Setup
      const pathAsUri = this._pathAsUri;
      const disableSrcSet = this.disableSrcSet;
      const client = this._client;
      const buildWithOptions = (options) =>
        client.buildURL(pathAsUri.path(), options);

      const isFixedDimensionsMode = widthProp != null || heightProp != null;

      const shouldShowDebugParams = config.APP.imgix.debug;

      const imgixOptions = this.options;

      const aspectRatio = imgixOptions.ar;
      if (aspectRatio != null && !isAspectRatioValid(aspectRatio)) {
        // false return value from isAspectRatioValid indicates invalid format
        // eslint-disable-next-line no-console
        console.warn(
          `[imgix] The aspect ratio passed ("${aspectRatio}") is not in the correct format. The correct format is "W:H".`
        );
      }

      const width = widthProp;
      const height = heightProp;

      const debugParams = shouldShowDebugParams
        ? buildDebugParams({ width, height })
        : {};

      // Build base options
      const options = {
        // default params from application config
        ...(config.APP.imgix.defaultParams || {}),
        // Add fit from 'fit' prop
        fit: this.fit,
        // Add width from computed width, or width prop
        ...(width != null ? { w: width } : {}),
        // Add height from computed height, or height prop
        ...(height != null ? { h: height } : {}),
        // Add crop from 'crop' prop
        ...(this.crop != null ? { crop: this.crop } : {}),
        // Add imgix options from 'options' prop
        ...imgixOptions,
        // Add debug params
        ...debugParams,
        // Add any parameters that were set in the 'path' prop
        ...pathAsUri.queryPairs.reduce((memo, param) => {
          memo[param[0]] = param[1];
          return memo;
        }, {}),
      };

      // Build src from base options
      const src = buildWithOptions(options);

      // Calculate src set (if enabled)
      const srcset = (() => {
        if (disableSrcSet) {
          return;
        }

        // w-type srcsets should not be used if one of the dimensions has been fixed as it will have no effect
        if (isFixedDimensionsMode) {
          const buildWithDpr = (dpr) =>
            buildWithOptions({
              ...options,
              dpr,
            });
          // prettier-ignore
          return `${buildWithDpr(2)} 2x, ${buildWithDpr(3)} 3x, ${buildWithDpr(4)} 4x, ${buildWithDpr(5)} 5x`;
        } else {
          const buildSrcSetPair = (targetWidth) => {
            const debugParams = shouldShowDebugParams
              ? buildDebugParams({ width: targetWidth })
              : {};

            const urlOptions = {
              ...options,
              ...debugParams,
              w: targetWidth,
            };
            const url = buildWithOptions(urlOptions);
            return `${url} ${targetWidth}w`;
          };

          return targetWidths.map(buildSrcSetPair).join(', ');
        }
      })();

      return { src, srcset };
    }
  ),

  src: reads('_srcAndSrcSet.src'),
  srcset: reads('_srcAndSrcSet.srcset'),
  placeholderSrc: computed('_client', 'placeholderPath', function () {
    if (attributeMap.src === 'src') {
      return null;
    }
    const client = this._client;
    const placeholderPathURI = new URI(this.placeholderPath);
    const placeholderURL = client.buildURL(placeholderPathURI.path(), {
      ...placeholderPathURI.queryPairs.reduce((memo, param) => {
        memo[param[0]] = param[1];
        return memo;
      }, {}),
    });
    return placeholderURL;
  }),

  elementClassNames: computed('config.APP.imgix.classNames', function () {
    return config.APP.imgix.classNames || 'imgix-image';
  }),

  _handleImageLoad(event) {
    debounce(this, () => !this.isDestroyed && this.onLoad?.(event), 500);
  },

  _handleImageError(event) {
    debounce(this, () => !this.isDestroyed && this.onError?.(event), 500);
  },
});

function isDimensionInvalid(widthProp) {
  return widthProp != null && (typeof widthProp !== 'number' || widthProp <= 0);
}
