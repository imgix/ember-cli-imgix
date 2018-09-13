import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import { tryInvoke } from '@ember/utils';
import config from 'ember-get-config';
import EmberError from '@ember/error';
import ImgixClient from 'imgix-core-js';
import URI from 'jsuri';
import { debounce } from '@ember/runloop';
import { constants, targetWidths, toFixed } from '../common';
import layout from '../templates/components/imgix-image-fluid';
import ResizeAware from 'ember-resize-aware/mixins/resize-aware';

export default Component.extend(ResizeAware, {
  layout,
  tagName: '',

  path: null, // The path to your image
  aspectRatio: null,
  crop: null,
  fit: 'crop',
  pixelStep: 10,
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

  debounceRate: 400,

  _width: null,
  _height: null,

  actions: {
    handleChildInsert(childElement) {
      set(this, 'childElement', childElement);

      this.didResize(
        get(this, 'width') ||
          get(this, '_width') ||
          childElement.getBoundingClientRect().width ||
          childElement.parentElement.getBoundingClientRect().width,
        get(this, 'height') ||
          get(this, '_height') ||
          childElement.getBoundingClientRect().height ||
          childElement.parentElement.getBoundingClientRect().height
      );
    }
  },

  didResize(width, height) {
    console.log('Resizing with w, h:', width, ',', height);
    if (get(this, 'path')) {
      const newDpr = toFixed(2, window.devicePixelRatio || 1);
      const newWidth =
        Math.ceil(
          (get(this, '_pathAsUri').getQueryParamValue('w') || width) /
            get(this, 'pixelStep')
        ) *
        get(this, 'pixelStep') *
        newDpr;
      const newHeight =
        Math.floor(
          get(this, 'aspectRatio')
            ? newWidth / get(this, 'aspectRatio')
            : get(this, '_pathAsUri').getQueryParamValue('h') || height
        ) * newDpr;

      console.log('Setting w x h: ', newWidth, 'x', newHeight);
      set(this, '_width', newWidth);
      set(this, '_height', newHeight);
    }
  },

  didInsertElement(...args) {
    this._super(...args);

    // TODO: Update these to work with HOC
    if (get(this, 'onLoad')) {
      // this._handleImageLoad = this._handleImageLoad.bind(this);
      // this.element.addEventListener('load', this._handleImageLoad);
    }

    if (get(this, 'onError')) {
      // this._handleImageError = this._handleImageError.bind(this);
      // this.element.addEventListener('error', this._handleImageError);
    }
  },

  didUpdateAttrs(...args) {
    this._super(...args);

    if (typeof FastBoot === 'undefined') {
      const childElement = get(this, 'childElement');
      this.didResize(
        get(this, 'width') ||
          get(this, '_width') ||
          childElement.getBoundingClientRect().width ||
          childElement.parentElement.getBoundingClientRect().width,
        get(this, 'height') ||
          get(this, '_height') ||
          childElement.getBoundingClientRect().height ||
          childElement.parentElement.getBoundingClientRect().height
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
