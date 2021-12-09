# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.0"></a>
# [3.0.0](https://github.com/imgix/ember-cli-imgix/compare/v2.1.2...v3.0.0) (2021-12-09)

### BREAKING CHANGES

* The deprecated imgix-image-wrapped component has been removed.
* Ember 2.x is no longer supported.



<a name="2.1.2"></a>
## [2.1.2](https://github.com/imgix/ember-cli-imgix/compare/v2.1.1...v2.1.2) (2020-01-03)


### Bug Fixes

* remove fallback src from srcset list ([#122](https://github.com/imgix/ember-cli-imgix/issues/122)) ([95206ff](https://github.com/imgix/ember-cli-imgix/commit/95206ff))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/imgix/ember-cli-imgix/compare/v2.1.0...v2.1.1) (2019-07-11)

* chore(deps): upgrade imgix-core-js to v2.0.0 ([#75](https://github.com/imgix/ember-cli-imgix/pull/75)) ([9a4c0de](https://github.com/imgix/ember-cli-imgix/commit/9a4c0dec07c03416b4c7bf9ff9b70e130493c6f2))

<a name="2.1.0"></a>
# [2.1.0](https://github.com/imgix/ember-cli-imgix/compare/v2.0.0...v2.1.0) (2019-03-08)

### Features

* add global default parameters, which can be specified from the application config ([#72](https://github.com/imgix/ember-cli-imgix/pull/72)) ([0a12f4a](https://github.com/imgix/ember-cli-imgix/commit/0a12f4ab65ae6ddfeb1b3866a46a43d8f8d87d99))
* `imgix-bg`: a new component which enables an image to be rendered as a background behind children components ([#70](https://github.com/imgix/ember-cli-imgix/pull/70/)) ([541f3d6](https://github.com/imgix/ember-cli-imgix/commit/541f3d63c0db9e0a3bfcfc44163c1d9f20b2ce66))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/imgix/ember-cli-imgix/compare/v1.0.2...v2.0.0) (2018-11-01)

The largest change in this major version bump is the move to width-based srcSet and sizes for responsiveness. This has a host of benefits, including better server rendering, better responsiveness, less potential for bugs, and perfomance improvements. More information about this change and how to use it can be found in the readme, and the [upgrade guide](https://github.com/imgix/ember-cli-imgix#version-1x-to-version-2x).


### Bug Fixes

* ensure new ar implementation uses old format for deprecated attribute ([#68](https://github.com/imgix/ember-cli-imgix/issues/68)) ([c998471](https://github.com/imgix/ember-cli-imgix/commit/c998471))
* generate height when width + ar is given, or vice versa ([#66](https://github.com/imgix/ember-cli-imgix/issues/66)) ([b106cac](https://github.com/imgix/ember-cli-imgix/commit/b106cac))
* update debug params to work with srcset ([#65](https://github.com/imgix/ember-cli-imgix/issues/65)) ([67ef1ad](https://github.com/imgix/ember-cli-imgix/commit/67ef1ad))


### Features

* implement responsiveness with srcSet and sizes ([#56](https://github.com/imgix/ember-cli-imgix/issues/56)) ([ee875c8](https://github.com/imgix/ember-cli-imgix/commit/ee875c8))
* **ar:** add aspect ratio support by calculating client-side ([#62](https://github.com/imgix/ember-cli-imgix/issues/62)) ([09068b0](https://github.com/imgix/ember-cli-imgix/commit/09068b0))
* **attribute bindings:** add attribute bindings for draggable attribute (and tests for the other attribute bindings crossorigin & alt) ([#54](https://github.com/imgix/ember-cli-imgix/issues/54)) ([bf28645](https://github.com/imgix/ember-cli-imgix/commit/bf28645))


### BREAKING CHANGES

* This component no longer fits to the size of a container. Instead, a combination of aspect ratio, srcset, and sizes should be used to implement this behaviour. 



<a name="1.0.2"></a>
## [1.0.2](https://github.com/imgix/ember-cli-imgix/compare/v1.0.1...v1.0.2) (2018-07-28)



<a name="1.0.1"></a>
## [1.0.1](https://github.com/imgix/ember-cli-imgix/compare/v1.0.0...v1.0.1) (2018-07-25)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/imgix/ember-cli-imgix/compare/v0.1.0...v1.0.0) Ember v2-3 and Fastboot support (2018-07-25)!

This is a major update, and this library now supports ember 2 and 3, and supports Fastboot! This update also updates component usage, and deprecates `imgix-image` in favour of a component that is not wrapped in a `div`.

### Breaking Changes

- Ember v1 is no longer supported
- The component API has changed. `imgix-image` has been renamed to `imgix-image-wrapped`, and `imgix-image-element` has been renamed to `imgix-image`. `imgix-image-wrapped` is deprecated and will be removed in v2. **Please see the [upgrade guide](https://github.com/imgix/ember-cli-imgix/tree/3b099198e9afefd26bceacb98e054f12422ac533#version-0x-to-version-1) for some assistance in upgrading**

### Features

- add ixlib url parameter to help Imgix support and analytics ([#43](https://github.com/imgix/ember-cli-imgix/issues/43)) ([12ae948](https://github.com/imgix/ember-cli-imgix/commit/12ae948))
- change default crop behaviour to undefined from faces ([#45](https://github.com/imgix/ember-cli-imgix/issues/45)) ([101a9be](https://github.com/imgix/ember-cli-imgix/commit/101a9be))
- constrain precision of dpr to 2 decimal places ([#44](https://github.com/imgix/ember-cli-imgix/issues/44)) ([74c9f9a](https://github.com/imgix/ember-cli-imgix/commit/74c9f9a))
- disable tests for ember v3.3+ ([#47](https://github.com/imgix/ember-cli-imgix/issues/47)) ([7cca43e](https://github.com/imgix/ember-cli-imgix/commit/7cca43e))
- support Ember v2, v3, update component API, fastboot support ([#31](https://github.com/imgix/ember-cli-imgix/issues/31)) ([8efe65f](https://github.com/imgix/ember-cli-imgix/commit/8efe65f))

<a name="0.3.8"></a>
## 0.3.8 (2016-08-12)



<a name="0.3.7"></a>
## 0.3.7 (2016-08-03)



<a name="0.3.6"></a>
## 0.3.6 (2016-08-02)



<a name="0.3.5"></a>
## 0.3.5 (2016-06-20)



<a name="0.3.4"></a>
## 0.3.4 (2016-06-13)



<a name="0.3.3"></a>
## 0.3.3 (2016-06-07)



<a name="0.3.2"></a>
## 0.3.2 (2016-06-07)



<a name="0.3.1"></a>
## 0.3.1 (2016-06-02)



<a name="0.3.0"></a>
# 0.3.0 (2016-04-08)



<a name="0.2.2"></a>
## 0.2.2 (2016-03-30)



<a name="0.2.1"></a>
## 0.2.1 (2016-03-29)



<a name="0.2.0"></a>
# 0.2.0 (2016-03-02)



<a name="0.1.2"></a>
## 0.1.2 (2015-12-26)
