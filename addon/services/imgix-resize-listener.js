import Ember from 'ember';
import getOwner from 'ember-getowner-polyfill';

const {
  Service,
  set,
  get,
  run,
  getWithDefault
} = Ember;

export default Service.extend({
  subscribers: null,
  debounceRate: null,

  init() {
    set(this, 'subscribers', []);
    set(this, 'debounceRate',
      getWithDefault(getOwner(this).resolveRegistration('config:environment'), 'APP.imgix.debounceRate', 200));
    this.initMasterHandler();
  },

  subscribe(handler) {
    get(this, 'subscribers').push(handler);
  },

  unsubscribe(handler) {
    set(this, 'subscribers', get(this, 'subscribers').filter(function(thisHandler) {
      return thisHandler !== handler;
    }));
  },

  initMasterHandler() {
    this.masterHandler = this.masterHandler.bind(this);
    window.addEventListener('resize', this.masterHandler);
    set(this, 'masterHandlerSubscribed', true);
  },

  masterHandler() {
    run.debounce(this, this.notifySubscribers, get(this, 'debounceRate'));
  },

  notifySubscribers() {
    get(this, 'subscribers')
      .forEach(function(subscriber) { subscriber(); });
  }
});
