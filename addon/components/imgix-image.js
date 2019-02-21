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
  classNameBindings: ['elementClassNames'],
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
      // Warnings, checks
      if (!get(this, 'path')) {
        return;
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
      const widthProp = get(this, 'width');
      const heightProp = get(this, 'height');
      if (isDimensionInvalid(widthProp) || isDimensionInvalid(heightProp)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[imgix] Either the width or height passed to this component (w: ${widthProp}, h: ${heightProp}) was invalid. Both width and height need to be a number greater than 0, or undefined.`
        );
      }

      // Setup
      const pathAsUri = get(this, '_pathAsUri');
      const disableSrcSet = get(this, 'disableSrcSet');
      const client = get(this, '_client');
      const buildWithOptions = options =>
        client.buildURL(pathAsUri.path(), options);

      const isFixedDimensionsMode = widthProp != null || heightProp != null;

      const shouldShowDebugParams = get(config, 'APP.imgix.debug');

      const { imgixOptions, aspectRatio } = (() => {
        let imgixOptions = {
          ...get(this, 'options')
        };
        const deprecatedAR = get(this, 'aspectRatio');
        let aspectRatio = deprecatedAR ? deprecatedAR + ':1' : undefined;
        if (imgixOptions.ar) {
          aspectRatio = imgixOptions.ar;
          delete imgixOptions.ar;
        }

        return { imgixOptions, aspectRatio };
      })();

      // Calculate AR
      const aspectRatioDecimal = parseAspectRatio(aspectRatio);
      if (aspectRatio != null && aspectRatioDecimal === false) {
        // false return value from parseAspectRatio indicates invalid response
        // eslint-disable-next-line no-console
        console.warn(
          `[imgix] The aspect ratio passed ("${aspectRatio}") is not in the correct format. The correct format is "W:H".`
        );
      }

      // Ensure width and height are set correctly according to aspect ratio
      const { width, height } = (() => {
        if (widthProp && heightProp && aspectRatio) {
          // eslint-disable-next-line no-console
          console.warn(
            `[imgix] All three of width, height, and aspect ratio were passed. The aspect ratio prop has no effect in this configuration.`
          );
        }
        if (!widthProp && !heightProp && disableSrcSet && aspectRatio) {
          // eslint-disable-next-line no-console
          console.warn(
            `[imgix] The aspect ratio prop has no effect when when srcsets are disabled and neither width nor height are set. To use aspect ratio, please either pass a width or height value, or enable src sets.`
          );
        }

        const neitherWidthNorHeightPassed = !(widthProp || heightProp);
        const bothWidthAndHeightPassed = widthProp && heightProp;
        const shouldReturnOriginalDimensions =
          neitherWidthNorHeightPassed || // we need at least one dimension to generate the other one
          bothWidthAndHeightPassed || // if both dimensions are already passed, we don't need to generate one
          !aspectRatioDecimal; // can't generate dimensions without an AR

        if (shouldReturnOriginalDimensions) {
          return { width: widthProp, height: heightProp };
        }

        if (widthProp) {
          const height = Math.ceil(widthProp / aspectRatioDecimal);
          return { width: widthProp, height };
        } else if (heightProp) {
          const width = Math.ceil(heightProp * aspectRatioDecimal);
          return { width, height: heightProp };
        } else {
          return { width: widthProp, height: heightProp };
        }
      })();

      const debugParams = shouldShowDebugParams
        ? buildDebugParams({ width, height })
        : {};

      // Build base options
      const options = {
        // default params from application config
        ...(config.APP.imgix.defaultParams || {}),
        // Add fit from 'fit' prop
        fit: get(this, 'fit'),
        // Add width from computed width, or width prop
        ...(width != null ? { w: width } : {}),
        // Add height from computed height, or height prop
        ...(height != null ? { h: height } : {}),
        // Add crop from 'crop' prop
        ...(get(this, 'crop') != null ? { crop: get(this, 'crop') } : {}),
        // Add imgix options from 'options' prop
        ...imgixOptions,
        // Add debug params
        ...debugParams,
        // Add any parameters that were set in the 'path' prop
        ...pathAsUri.queryPairs.reduce((memo, param) => {
          memo[param[0]] = param[1];
          return memo;
        }, {})
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
          const buildWithDpr = dpr =>
            buildWithOptions({
              ...options,
              dpr
            });
          // prettier-ignore
          return `${buildWithDpr(2)} 2x, ${buildWithDpr(3)} 3x, ${buildWithDpr(4)} 4x, ${buildWithDpr(5)} 5x`;
        } else {
          const buildSrcSetPair = targetWidth => {
            const targetHeight = (() => {
              const isARInvalid = !(
                aspectRatioDecimal && aspectRatioDecimal > 0
              );
              if (options.h || isARInvalid) {
                return options.h;
              }

              return Math.ceil(targetWidth / aspectRatioDecimal);
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

          return addFallbackSrc(targetWidths.map(buildSrcSetPair)).join(', ');
        }
      })();

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

  elementClassNames: computed('config.APP.imgix.classNames', function() {
    return config.APP.imgix.classNames || 'imgix-image';
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
  }
});

function isDimensionInvalid(widthProp) {
  return widthProp != null && (typeof widthProp !== 'number' || widthProp <= 0);
}
