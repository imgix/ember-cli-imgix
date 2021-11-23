import { setProperties } from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import URI from 'jsuri';
import config from 'ember-get-config';

module('Unit | Component | imgix image', function (hooks) {
  setupTest(hooks);

  test('the generated img has a srcset in the format of 2x, 3x, 4x, 5x when passing a fixed width', function (assert) {
    assert.expect(5);
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
      width: 100,
    });

    const srcset = component.get('srcset');
    const actualNumberOfSrcSets = srcset.split(', ').length;
    assert.equal(actualNumberOfSrcSets, 4);
    srcset.split(', ').forEach((srcset) => {
      assert.ok(srcset.split(' ')[1].match(/^\dx$/));
    });
  });

  test('the generated img has a srcset in the format of 2x, 3x, 4x, 5x when passing a fixed height', function (assert) {
    assert.expect(5);
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
      height: 100,
    });

    const srcset = component.get('srcset');
    const actualNumberOfSrcSets = srcset.split(', ').length;
    assert.equal(actualNumberOfSrcSets, 4);
    srcset.split(', ').forEach((srcset) => {
      assert.ok(srcset.split(' ')[1].match(/^\dx$/));
    });
  });

  test('the generated img has the correct number of srcsets', function (assert) {
    const expectedNumberOfSrcSets = 31;

    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
    });

    const srcset = component.get('srcset');
    const actualNumberOfSrcSets = srcset.split(',').length;
    assert.equal(actualNumberOfSrcSets, expectedNumberOfSrcSets);
  });

  test('the generated img has srcsets in the correct format', function (assert) {
    assert.expect(93);
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
    });

    const srcset = component.get('srcset');
    const srcsets = srcset.split(',').map((v) => v.trim());

    srcsets.forEach((srcset) => {
      assert.equal(srcset.split(' ').length, 2);
      const [url, width] = srcset.split(' ');
      assert.ok(url);
      assert.ok(width.match(/^\d+w$/));
    });
  });

  test('the generated img should not contain a srcset when disableSrcSet is set', function (assert) {
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
      disableSrcSet: true,
    });

    const srcset = component.get('srcset');
    assert.notOk(srcset);
  });

  test('the generated src url has an ixlib parameter', function (assert) {
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
    });

    const src = component.get('src');
    const url = new URI(src);
    assert.ok(src.includes('ixlib=ember-'));
    assert.ok(/^ember-\d\.\d\.\d$/.test(url.getQueryParamValue('ixlib')));
  });

  test('setting disableLibraryParam should cause the url not to contain an ixlib parameter', function (assert) {
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
      disableLibraryParam: true,
    });

    const src = component.get('src');
    assert.false(src.includes('ixlib=ember-'));
  });

  test('setting disableLibraryParam in the global config should cause the url not to contain an ixlib parameter', function (assert) {
    const oldDisableLibraryParam = config.APP.imgix.disableLibraryParam;

    config.APP.imgix.disableLibraryParam = true;
    const component = this.owner.factoryFor('component:imgix-image').create();
    setProperties(component, {
      path: '/users/1.png',
    });

    const src = component.get('src');
    assert.false(src.includes('ixlib=ember-'));

    config.APP.imgix.disableLibraryParam = oldDisableLibraryParam;
  });
});
