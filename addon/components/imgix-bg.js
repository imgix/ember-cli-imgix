import Component from '@ember/component';
import { computed, set } from '@ember/object';
import { htmlSafe } from '@ember/template';
import config from 'ember-get-config';
import ResizeAware from 'ember-resize-aware/mixins/resize-aware';
import { toFixed, constants, targetWidths, findClosest } from '../common';
import URI from 'jsuri';
import EmberError from '@ember/error';
import ImgixClient from '@imgix/js-core';

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

const findNearestWidth = (actualWidth) =>
  findClosest(actualWidth, targetWidths);

function isDimensionInvalid(widthProp) {
  return widthProp != null && (typeof widthProp !== 'number' || widthProp <= 0);
}

export default Component.extend(ResizeAware, {
  tagName: 'div',
  classNameBindings: ['elementClassNames'],
  attributeBindings: ['style', 'alt'],

  path: null, // The path to your image
  crop: null,
  fit: 'crop',
  alt: '', // img element alt attr
  options: {}, // arbitrary imgix options
  disableLibraryParam: false,

  width: null,
  height: null,
  sizes: null,
  disableSrcSet: false,

  style: computed('_src', function () {
    const src = this._src;

    const style = {
      ...(src && {
        'background-image': `url('${src}')`,
        'background-size': 'cover',
      }),
    };
    return htmlSafe(
      Object.keys(style)
        .map((key) => `${key}: ${style[key]}`)
        .join(';')
    );
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

  _src: computed(
    '_client',
    '_dpr',
    '_height',
    '_pathAsUri',
    '_width',
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
      const forcedWidth = this.width;
      const forcedHeight = this.height;
      const measuredWidth = this._width;
      const measuredHeight = this._height;

      const hasDOMDimensions = measuredWidth != null;
      if (isDimensionInvalid(forcedWidth) || isDimensionInvalid(forcedHeight)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[imgix] Either the width or height passed to this component (w: ${forcedWidth}, h: ${forcedHeight}) was invalid. Both width and height need to be a number greater than 0, or undefined.`
        );
      }

      // Setup
      const pathAsUri = this._pathAsUri;
      const client = this._client;
      const buildWithOptions = (options) =>
        client.buildURL(pathAsUri.path(), options);

      const shouldShowDebugParams = config.APP.imgix.debug;

      const imgixOptions = this.options || {};
      const { width, height } = (() => {
        const bothWidthAndHeightPassed =
          forcedWidth != null && forcedHeight != null;

        if (bothWidthAndHeightPassed) {
          return { width: forcedWidth, height: forcedHeight };
        }

        if (!hasDOMDimensions) {
          return { width: undefined, height: undefined };
        }
        const ar = measuredWidth / measuredHeight;

        const neitherWidthNorHeightPassed =
          forcedWidth == null && forcedHeight == null;
        if (neitherWidthNorHeightPassed) {
          const width = findNearestWidth(measuredWidth);
          const height = Math.ceil(width / ar);
          return { width, height };
        }
        if (forcedWidth != null) {
          const height = Math.ceil(forcedWidth / ar);
          return { width: forcedWidth, height };
        } else if (forcedHeight != null) {
          const width = Math.ceil(forcedHeight * ar);
          return { width, height: forcedHeight };
        }
      })();

      if (width == null || height == null) {
        return undefined;
      }

      const debugParams = shouldShowDebugParams
        ? buildDebugParams({ width, height })
        : {};

      const dpr = toFixed(
        2,
        Number.parseFloat(imgixOptions.dpr) || this._dpr || 1
      );

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
        dpr,
      };

      // Build src from base options
      const src = buildWithOptions(options);

      return src;
    }
  ),

  elementClassNames: computed('config.APP.imgix.classNames', function () {
    return config.APP.imgix.classNames || 'imgix-bg';
  }),

  didResize(width, height) {
    if (this.path) {
      const newWidth = Math.ceil(
        this._pathAsUri.getQueryParamValue('w') || width
      );
      const newHeight = Math.floor(
        this._pathAsUri.getQueryParamValue('h') || height
      );
      const newDpr = toFixed(2, window.devicePixelRatio || 1);

      set(this, '_width', newWidth);
      set(this, '_height', newHeight);
      set(this, '_dpr', newDpr);
    }
  },

  _pathAsUri: computed('path', function () {
    if (!this.path) {
      return false;
    }

    return new URI(this.path);
  }),

  didInsertElement(...args) {
    this._super(...args);

    this.didResize(
      this._width ||
        this.element.clientWidth ||
        this.element.parentElement.clientWidth,
      this._height ||
        this.element.clientHeight ||
        this.element.parentElement.clientHeight
    );
  },
});
