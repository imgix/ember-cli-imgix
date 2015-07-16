import Ember from 'ember';
import ResizeMixin from 'ember-resize-mixin/main';
import layout from '../templates/components/imgix-image';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Ember.Component.extend(ResizeMixin, ImgixPathBehavior, {
  layout: layout,
  classNames: ['imgix-image-wrap']
});
