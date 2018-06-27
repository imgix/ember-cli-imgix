import Ember from 'ember';
import ResizeMixin from 'ember-resize-mixin/main';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Ember.Component.extend(ImgixPathBehavior, ResizeMixin, {
  tagName: 'img',
  layout: null,
  attributeBindings: ['src', 'crossorigin', 'style', 'alt'],

  useParentWidth: true
});
