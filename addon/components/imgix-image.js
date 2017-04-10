import Ember from 'ember';
import layout from '../templates/components/imgix-image';
import ImgixPathBehavior from '../mixins/imgix-path-behavior';

export default Ember.Component.extend(ImgixPathBehavior, {
  layout: layout,
  classNames: ['imgix-image-wrap']
});
