import Route from '@ember/routing/route';

export default class extends Route {
  beforeModel() {
    return this.replaceWith('examples');
  }
}
