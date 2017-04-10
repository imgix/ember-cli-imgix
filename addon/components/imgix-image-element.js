import Ember from 'ember';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Ember.Component.extend(ImgixPathBehavior, {
  tagName: 'img',
  layout: null,
  attributeBindings: ['src', 'crossorigin', 'style', 'alt'],

  useParentWidth: true,
});
