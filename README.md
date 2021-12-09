<!-- ix-docs-ignore -->
![imgix logo](https://assets.imgix.net/sdk-imgix-logo.svg)

`ember-cli-imgix` is an add-on that provides custom components for integrating [imgix](https://www.imgix.com) into Ember sites.

[![Version](https://img.shields.io/npm/v/ember-cli-imgix.svg)](https://www.npmjs.com/package/ember-cli-imgix)
[![Build Status](https://travis-ci.com/imgix/ember-cli-imgix.svg?branch=main)](https://travis-ci.com/imgix/ember-cli-imgix)
![Downloads](https://img.shields.io/npm/dt/ember-cli-imgix)
[![License](https://img.shields.io/github/license/imgix/ember-cli-imgix)](https://github.com/imgix/ember-cli-imgix/blob/main/LICENSE.md)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fimgix%2Fember-cli-imgix.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fimgix%2Fember-cli-imgix?ref=badge_shield)

---
<!-- /ix-docs-ignore -->
<!-- prettier-ignore-start -->

- [Overview / Resources](#overview--resources)
- [Installation](#installation)
    * [Global Configuration](#global-configuration)
- [Usage](#usage)
    * [imgix-image](#imgix-image)
        + [Parameters](#parameters)
        + [Other imgix Options](#other-imgix-options)
        + [Aspect Ratio](#aspect-ratio)
        + [attributeNameMap](#attributenamemap)
        + [Lifecycle Hooks](#lifecycle-hooks)
        + [Lazy Loading](#lazy-loading)
        + [Low Quality Image Placeholder Technique (LQIP)](#low-quality-image-placeholder-technique-lqip)
        + [ixlib param](#ixlib-param)
    * [imgix-bg](#imgix-bg)
    * [imgix-core-js](#imgix-core-js)
- [Upgrade Guide](#upgrade-guide)
    * [version 0.x to version 1](#version-0x-to-version-1)
    * [version 1.x to version 2.x](#version-1x-to-version-2x)
- [Browser Support](#browser-support)
- [Running a Test App](#running-a-test-app)
- [Running Tests](#running-tests)
- [License](#license)

<!-- prettier-ignore-end -->

**Note:** Front-end imgix libraries and framework integrations will not work with imgix Web Proxy Sources. They will only work with S3, Azure, Google Cloud Storage, or Web Folder sources.

## Overview / Resources

**Before you get started with `ember-cli-imgix`**, it's _highly recommended_ that you read Eric Portis' [seminal article on `srcset` and `sizes`](https://ericportis.com/posts/2014/srcset-sizes/). This article explains the history of responsive images in responsive design, why they're necessary, and how all these technologies work together to save bandwidth and provide a better experience for users. The primary goal of `ember-cli-imgix` is to make these tools easier for developers to implement, so having an understanding of how they work will significantly improve your experience when using these components. For a demonstration of this library in action, check out [this demo](https://imgix.github.io/ember-cli-imgix/).

Below are some other articles that help explain responsive imagery, and how it can work alongside imgix:

- [Responsive Images with `srcset` and imgix](https://docs.imgix.com/tutorials/responsive-images-srcset-imgix). A look into how imgix can work with `srcset` and `sizes` to serve the right image.

## Installation

From within an existing ember-cli project:

```bash
ember install ember-cli-imgix
```

### Global Configuration

The global configuration for this library should be located in `APP.imgix`, and has the following schema:

```js
imgix: {
  source: string,
  debug?: boolean,
  attributeNameMap?: {
    src: string
    srcset: string
    sizes: string
  },
  classNames?: string,
  defaultParams?: {}
}
```

It should look like this in `config/environment.js`.

```js
// config/environment.js

module.exports = function(environment) {
  var ENV = {
    // snip
    APP: {
      imgix: {
        source: 'my-social-network.imgix.net',
        debug: true, // Prints out diagnostic information on the image itself. Turn off in production.
        classNames: 'imgix-image', // default class used on the img element
        defaultParams: {}, // optional params that will be used in all generated paths
      }
    }
    // snip
  };
};
```

## Usage

**NOTE:** These docs are for the latest version of `ember-cli-imgix` (version 1). For the old docs, please go [here](https://github.com/imgix/ember-cli-imgix/blob/f9b5cd724e92270cfba96f3def977177c647cb00/README.md)

### imgix-image

`ember-cli-imgix` exposes an `img` element with expanded functionality:

```hbs
{{imgix-image path='/users/1.png' sizes='100vw'}}
```

Which will generate HTML similar to this:

```html
<img
  class="imgix-image"
  src="https://my-social-network.com/users/1.png"
  sizes="100vw"
  srcset="https://my-social-network.com/users/1.png?w=100 100w, https://my-social-network.com/users/1.png?w=200 200w, ..."
/>
```

The src attribute will have imgix URL API parameters added to it to perform the resize.

**Please note:** `100vw` is an appropriate `sizes` value for a full-bleed image. If your image is not full-bleed, you should use a different value for `sizes`. [Eric Portis' "Srcset and sizes"](https://ericportis.com/posts/2014/srcset-sizes/) article goes into depth on how to use the `sizes` attribute.

Since imgix can generate as many derivative resolutions as needed, `ember-cli-imgix` calculates them programmatically, using the dimensions you specify. All of this information has been placed into the srcset and sizes attributes.

**Width and height known:** If the width and height are known beforehand, it is recommended that they are set explicitly:

```hbs
{{imgix-image path='/users/1.png' width=100 height=100}}
```

NB: Since this library sets [`fit`](https://docs.imgix.com/apis/url/size/fit) to `crop` by default, when just a width or height is set, the image will resize and maintain aspect ratio. When both are set, the image will be cropped to that size, maintaining pixel aspect ratio (i.e. edges are clipped in order to not stretch the photo). If this isn't desired, set `fit` to be another value (e.g. `clip`)

#### Parameters

You can pass through most of the [params that imgix urls accept](https://docs.imgix.com/apis/url).

Some of the defaults are:

```js
path: null, // The path to your image
crop: null,
fit: 'crop',
onLoad: null,
onError: null,
crossorigin: 'anonymous', // img element crossorigin attr
alt: '', // img element alt attr
draggable: true, // img element draggable attr
disableSrcSet: false, // disable srcSet generation
options: {}, // arbitrary imgix options

width: null, // override if you want to hardcode a width into the image
height: null, // override if you want to hardcode a height into the image
```

#### Other imgix Options

If you want to pass in any other arbitrary imgix options, use the hash helper

```hbs
{{imgix-image
  path='/users/1.png'
  options=(hash
    invert=true
  )
}}
```

#### Aspect Ratio

This component can also accept an `ar` parameter to constrain the aspect ratio of the returned image. The aspect ratio is specified in the format width:height. Either dimension can be an integer or a float. All of the following are valid: 16:9, 5:1, 1.92:1, 1:1.67.

```hbs
{{imgix-image path="/users/1.png" crossorigin="anonymous" options=(hash ar="1.33:1"}}
```

#### attributeNameMap

`attributeNameMap` should be used if it is required to remap the HTML attribute to be used to set the src of the image. For example, if `data-src` should be used rather than `src`, `attributeNameMap` helps with this.

In the global config, `attributeNameMap` allows the following to be remapped: `src`, `srcset`, and `sizes`.

For example, to remap `srcset` to `data-srcset`:

```js
attributeNameMap: {
  srcset: `data-srcset`
}
```

The equivalent works for `src` and `sizes`.

#### Lifecycle Hooks

This element also exposes `onLoad` and `onError` actions which you can hook into to know when the image has loaded or failed to load:

```hbs
{{imgix-image
  path='/users/1.png'
  onLoad=(action 'handleImageLoad')
  onError=(action 'handleImageError')
}}
```

This will maintain the same aspect ratio as the image is resized.

Please see the [dummy app](./tests/dummy) for insight into setting this up and configuring this.

#### Lazy Loading

If you'd like to lazy load images, we recommend using [lazysizes](https://github.com/aFarkas/lazysizes). In order to use `ember-cli-imgix` with lazysizes generate the component with lazysizes-compatible attributes instead of the standard `src`, `srcset`, and `sizes` by changing some configuration settings:

```jsx
// config/environment.js

module.exports = function(environment) {
  var ENV = {
    // snip
    APP: {
      imgix: {
        attributeNameMap: {
          src: 'data-src',
          srcset: 'data-srcset'
        }
      }
    }
    // snip
  };
};
```

Otherwise, you can use the component as normal.

**NB:** It is recommended to use the [attribute change plugin](https://github.com/aFarkas/lazysizes/tree/gh-pages/plugins/attrchange) in order to capture changes in the data-\* attributes. Without this, changing the attributes to this library will have no effect on the rendered image.

#### Low Quality Image Placeholder Technique (LQIP)

If you'd like to use LQIP images, we recommend using [lazysizes](https://github.com/aFarkas/lazysizes). In order to use `ember-cli-imgix` with lazysizes, generate the component with lazysizes-compatible attributes instead of the standard `src` and `srcset` by changing some configuration settings, and providing a fallback image to `placeholderPath`.

```jsx
// config/environment.js

module.exports = function(environment) {
  var ENV = {
    // snip
    APP: {
      imgix: {
        attributeNameMap: {
          src: 'data-src',
          srcset: 'data-srcset'
        }
      }
    }
    // snip
  };
};
```

```hbs
// usage

{{imgix-image path='/abc.png' placeholderPath='/abc.png?w=80&h=50' }}
```

**NB:** If the props of the image are changed after the first load, the low quality image will replace the high quality image. In this case, the `src` attribute may have to be set by modifying the DOM directly, or the lazysizes API may have to be called manually after the props are changed. In any case, this behaviour is not supported by the maintainers of `ember-cli-imgix`, so use at your own risk.

#### ixlib param

This library adds an `ixlib` parameter to generated image urls for two reasons: a) it helps imgix support see what versions of libraries that customers are using, and b) it help imgix to see how many people overall are using the ember library, and the specific versions.

If this behaviour is not desired, it can be turned off in two ways:

1. Environment config

```js
// config/environment.js

module.exports = function(environment) {
  var ENV = {
    // snip
    APP: {
      imgix: {
        // snip
        disableLibraryParam: true
      }
    }
    // snip
  };
};
```

2. Component parameter

```hbs
{{imgix-image path="/test.png" disableLibraryParam={true} }}
```

### imgix-bg

This component will render a `div` whose `background-image` is set to the given image path. Content can be added within the `imgix-bg` tags and the component will automatically resize to fit around it.

```hbs
{{#imgix-bg path='/users/1.png' }}
  Some content here
{{/imgix-bg}}
```

This will generate html similar to the following:

```html
<div style="background-image: url('https://my-social-network.com/users/1.png?fit=crop&w=1246&h=15&dpr=2&ixlib=ember-2.0.0');background-size: cover" class="imgix-bg">    
  Some content here
</div>
```

**Note:** `imgix-bg` will respect any global default parameters unless explicitly overriden.

### imgix-core-js

`imgix-core-js` is available to you shimmed as:

```js
import imgix from 'imgix-core-js';
```

## Upgrade Guide

### version 0.x to version 1

`imgix-image` has been replaced by a new implementation of `imgix-image-element`. All usage of `imgix-image-element` can be replaced with `imgix-image`. No parameter changes are necessary.

`imgix-image` has been renamed to `imgix-image-wrapped` and has been deprecated. All usage of `imgix-image` can be replaced with `imgix-image-wrapped` for the duration of version 2. No parameter changes are necessary. After version 2, `imgix-image-wrapped` will not exist.

### version 1.x to version 2.x

The largest change in this major version bump is the move to width-based `srcSet` and `sizes` for responsiveness. This has a host of benefits, including better server rendering, better responsiveness, less potential for bugs, and perfomance improvements.

- A `sizes` prop should be added to all usages of ember-cli-imgix, unless the width or height of the image are known beforehand (see above). If `sizes` is new to you (or even if it's not), Eric's [seminal article on `srcset` and `sizes`](https://ericportis.com/posts/2014/srcset-sizes/) is highly recommended.
- `aspectRatio` has been moved to `options.ar`. Thus, `aspectRatio` has been deprecated. It will be supported until the v3 release. The format of the new `options.ar` attribute is `w:h`.

## Browser Support

- By default, browsers that don't support [`srcset`](http://caniuse.com/#feat=srcset), [`sizes`](http://caniuse.com/#feat=srcset), or [`picture`](http://caniuse.com/#feat=picture) will gracefully fall back to the default `img` `src` when appropriate. If you want to provide a fully-responsive experience for these browsers, `ember-cli-imgix` works great alongside [Picturefill](https://github.com/scottjehl/picturefill)!
- We support the latest version of Google Chrome (which [automatically updates](https://support.google.com/chrome/answer/95414) whenever it detects that a new version of the browser is available). We also support the current and previous major releases of desktop Firefox, Internet Explorer, and Safari on a rolling basis. Mobile support is tested on the most recent minor version of the current and previous major release for the default browser on iOS and Android (e.g., iOS 9.2 and 8.4). Each time a new version is released, we begin supporting that version and stop supporting the third most recent version.

## Running a Test App

To see this in action with some stock photos, clone this repo and then run `ember serve`

```bash
git clone git@github.com:imgix/ember-cli-imgix.git
cd ember-cli-imgix
ember serve
```

Now visit [http://localhost:4200](http://localhost:4200).

## Running Tests

Pretty simple:

```bash
ember test
```

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fimgix%2Fember-cli-imgix.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fimgix%2Fember-cli-imgix?ref=badge_large)
