import Ember from 'ember';
import Client from 'imgix-core-js';
import ResizeMixin from 'ember-resize-mixin/main';
import layout from '../templates/components/imgix-image';

export default Ember.Component.extend(ResizeMixin, {
  layout: layout,
  crossorigin: null,

  /**
   * @public
   * @property {string} The main entry point for our component. The final `src` will be set based on a manipulation of this property.
   */
  path: null,

  /**
   * @private
   * @default 0
   * @property {number} An internal counter to used to trigger resizes.
   */
  _resizeCounter: 0,

  /**
   * The main meat of our responsive imaging. We use an instance of {Imgix.Client} to build up a new image
   * URL based on `path` and apply the correct sizing parameters as we go.
   *
   * @public
   * @property {string}
   * @return the fully built string
   */
  src: Ember.computed('path', '_width', '_height', '_dpr', function () {
    let env = this.get('_config');
    let options = {
      w: this.get('_width'),
      h: this.get('_height'),
      dpr: this.get('_dpr'),
      crop: "faces",
      fit: "crop"
    };

    if (!!env && Ember.get(env, 'APP.imgix.debug')) {
      Ember.merge(options, this.get('_debugParams'));
    }

    return this.get('_client').path(this.get('path')).toUrl(options).toString();
  }),

  /**
   * Fire off a resize after our element has been added to the DOM.
   */
  didInsertElement: function () {
    this._incrementResizeCounter();
  },

  /**
   * Observer to trigger image resizes, but debounced.
   * @private
   */
  _onResize: Ember.on('resize', function () {
    let debounceRate = 200;
    let env = this.get('_config');
    if (!!env && !!Ember.get(env, 'APP.imgix.debounceRate')) {
      debounceRate = Ember.get(env, 'APP.imgix.debounceRate');
    }
    Ember.run.debounce(this, this._incrementResizeCounter, debounceRate);
  }),

  /**
   * @property {Imgix.Client} instantiated Imgix.Client
   * @throws {Ember.Error} Will throw an error if the imgix config information is not found in config/environment.js
   * @return {Imgix.Client} return an instantiated Imgix.Client instance.
   */
  _client: Ember.computed(function () {
    let env = this.get('_config');
    if (!env || !Ember.get(env, 'APP.imgix.source')) {
      throw new Ember.Error("Could not find a source in the application configuration. Please configure APP.imgix.source in config/environment.js. See https://github.com/imgix/ember-cli-imgix for more information.");
    }

    return new Client(env.APP.imgix.source);
  }),

  /**
   * Increments an internal resize counter, which will trigger an image resize.
   *
   * @private
   * @method _incrementResizeCounter
   */
  _incrementResizeCounter: function () {
    this.incrementProperty('_resizeCounter');
  },

  /**
   * @property {Object}
   * @return {Object} a POJO with some extra imgix parameters to overlay debug data on our image.
   * @private
   */
  _debugParams: Ember.computed('_width', '_height', '_dpr', function () {
    return {
      txt: `${this.get('_width')} x ${this.get('_height')} @ DPR ${this.get('_dpr')}`,
      txtalign: "center,bottom",
      txtsize: 20,
      txtfont: "Helvetica Neue",
      txtclr: "ffffff",
      txtpad: 20,
      txtfit: "max",
      exp: -2
    };
  }),

  /**
   * Width as computed by the child image element's clientWidth
   * @private
   * @property _width
   * @default 0
   */
  _width: Ember.computed('_resizeCounter', function () {
    return this.get('element.clientWidth') || 0;
  }),

  /**
   * Height as computed by the child image element's clientHeight
   * @private
   * @property _height
   * @default 0
   */
  _height: Ember.computed('_resizeCounter', function () {
    return this.get('element.clientHeight') || 0;
  }),

  /**
   * Device Pixel Ratio as reported by the client.
   * @private
   * @property _dpr
   * @return {Number} devicePixelRatio for the client
   * @default 1
   */
  _dpr: Ember.computed('_resizeCounter', function () {
    return window.devicePixelRatio || 1;
  }),

  /**
   * Simple abstraction for reading the app's configuration. Useful for testing.
   * @private
   */
  _config: Ember.computed(function () {
    return this.container.lookupFactory('config:environment');
  })
});
