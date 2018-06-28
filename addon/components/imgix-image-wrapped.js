import Component from '@ember/component';
import ResizeMixin from 'ember-resize-mixin/main';
import layout from '../templates/components/imgix-image-wrapped';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Component.extend(ResizeMixin, ImgixPathBehavior, {
  layout: layout,
  classNames: ['imgix-image-wrap']
});
