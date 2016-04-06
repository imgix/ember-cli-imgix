import Ember from 'ember';

const {
  computed,
  merge,
  on
} = Ember;

/* global URI, ImgixClient */

export default Ember.Mixin.create({
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
    let uri = URI(this.get('path'));
    return uri.pathname();
  }),

  /**
   * @private
   * @property {Object} a hash of key-value pairs for parameters that were passed in via the `path` property
   */
  _query: computed('path', function() {
    let uri = URI(this.get('path'));
    return Ember.Object.create(uri.search(true));
  }),

  _widthFromPath: computed('_query', function() {
    return this.get('_query.w');
  }),

  _heightFromPath: computed('_query', function() {
    return this.get('_query.h');
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
  src: computed('_path', '_query', '_width', '_height', '_dpr', 'crop', 'fit', function () {
    let env = this.get('_config');

    // These operations are defaults and should be overidden by any incoming
    // query parameters
    let options = {
      crop: this.get('crop') || "faces",
      fit: this.get('fit') || "crop"
    };

    if (this.get('auto')) {
      merge(options, { auto: this.get('auto') });
    }

    if (this.get('_query')) {
      merge(options, this.get('_query'));
    }

    if (!!env && Ember.get(env, 'APP.imgix.debug')) {
      merge(options, this.get('_debugParams'));
    }

    // This is where the magic happens. These are the parameters that force the
    // responsiveness that we're looking for.
    merge(options, {
      w: this.get('_width'),
      h: this.get('_height'),
      dpr: this.get('_dpr')
    });

    return this.get('_client').buildURL(this.get('_path'), options);
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
  _onResize: on('resize', function () {
    let debounceRate = 200;
    let env = this.get('_config');
    if (!!env && !!Ember.get(env, 'APP.imgix.debounceRate')) {
      debounceRate = Ember.get(env, 'APP.imgix.debounceRate');
    }
    Ember.run.debounce(this, this._incrementResizeCounter, debounceRate);
  }),

  /**
   * @property ImgixClient instantiated ImgixClient
   * @throws {Ember.Error} Will throw an error if the imgix config information is not found in config/environment.js
   * @return ImgixClient return an instantiated ImgixClient instance.
   */
  _client: computed(function () {
    let env = this.get('_config');
    if (!env || !Ember.get(env, 'APP.imgix.source')) {
      throw new Ember.Error("Could not find a source in the application configuration. Please configure APP.imgix.source in config/environment.js. See https://github.com/imgix/ember-cli-imgix for more information.");
    }

    return new ImgixClient({ host: env.APP.imgix.source });
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
  _debugParams: computed('_width', '_height', '_dpr', function () {
    return {
      txt64: `${this.get('_width')} x ${this.get('_height')} @ DPR ${this.get('_dpr')}`,
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
  _width: computed('_resizeCounter', 'pixelStep', 'useParentWidth', function () {
    let newWidth = 0;

    if (this.get('useParentWidth') && this.get('element')) {
      newWidth = this.$().parent().outerWidth();
    }

    if (!newWidth) {
      newWidth = this.get('element.clientWidth') || this.get('_widthFromPath');
    }
    let pixelStep = this.get('pixelStep');
    return Math.ceil(newWidth / pixelStep) * pixelStep;
  }),

  /**
   * Height as computed by the child image element's clientHeight
   * @private
   * @property _height
   * @default 0
   */
  _height: computed('aspectRatio', '_resizeCounter', '_width', function () {
    let newHeight = this.get('element.clientHeight') || 0;

    if (this.get('aspectRatio')) {
      newHeight = this.get('_width') / this.get('aspectRatio');
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
  _dpr: computed('_resizeCounter', function () {
    return window.devicePixelRatio || 1;
  }),

  /**
   * Simple abstraction for reading the app's configuration. Useful for testing.
   * @private
   */
  _config: computed(function () {
    return this.container.lookupFactory('config:environment');
  })
});
