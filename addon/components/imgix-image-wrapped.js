import Component from '@ember/component';
import { deprecate } from '@ember/application/deprecations';
import ResizeMixin from 'ember-resize-mixin/main';
import layout from '../templates/components/imgix-image-wrapped';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Component.extend(ResizeMixin, ImgixPathBehavior, {
  layout: layout,
  classNames: ['imgix-image-wrap'],
  init() {
    this._super(...arguments);
    deprecate(
      'imgix-image-wrapped is deprecated and will be removed in ember-cli-imgix@2. Please migrate to using imgix-image instead.',
      false,
      {
        id: 'ember-cli-imgix/imgix-image-wrapper-deprecation',
        until: '2.0.0'
      }
    );
  }
});
