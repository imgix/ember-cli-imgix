# ember-cli-imgix

[![Build Status](https://travis-ci.org/imgix/ember-cli-imgix.png?branch=master)](https://travis-ci.org/imgix/ember-cli-imgix)

An Ember addon for easily adding responsive imagery via [imgix](https://www.imgix.com) to your application. This addons supports FastBoot.

**Note:** Front-end imgix libraries and framework integrations will not work with imgix Web Proxy Sources. They will only work with imgix Web Folder or S3 Sources.

## Overview / Resources

**Before you get started with ember-cli-imgix**, it's _highly recommended_ that you read Eric Portis' [seminal article on `srcset` and `sizes`](https://ericportis.com/posts/2014/srcset-sizes/). This article explains the history of responsive images in responsive design, why they're necessary, and how all these technologies work together to save bandwidth and provide a better experience for users. The primary goal of ember-cli-imgix is to make these tools easier for developers to implement, so having an understanding of how they work will significantly improve your ember-cli-imgix experience.

Below are some other articles that help explain responsive imagery, and how it can work alongside imgix:

- [Responsive Images with `srcset` and imgix](https://docs.imgix.com/tutorials/responsive-images-srcset-imgix). A look into how imgix can work with `srcset` and `sizes` to serve the right image.

## Installation

From within an existing ember-cli project:

```bash
$ ember install ember-cli-imgix
```

Next, set up some configuration flags:

```javascript
// config/environment.js

module.exports = function(environment) {
  var ENV = {
    // snip
    APP: {
      imgix: {
        source: 'my-social-network.imgix.net',
        debug: true // Prints out diagnostic information on the image itself. Turn off in production.
      }
    }
    // snip
  };
};
```

## Usage

**NOTE:** These docs are for the latest version of ember-cli-imgix (version 1). For the old docs, please go [here](https://github.com/imgix/ember-cli-imgix/blob/f9b5cd724e92270cfba96f3def977177c647cb00/README.md)

### imgix-image

`ember-cli-imgix` exposes a `img` element with expanded functionality. It simply renders an `img`, but has some extra parameters

```hbs
{{imgix-image path='/users/1.png' sizes='100vw'}}
```

Which will generate some HTML similar to this:

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

Since imgix can generate as many derivative resolutions as needed, ember-cli-imgix calculates them programmatically, using the dimensions you specify. All of this information has been placed into the srcset and sizes attributes.

**Width and height known:** If the width and height are known beforehand, it is recommended that they are set explicitly:

```hbs
{{imgix-image path='/users/1.png' width=100 height=100}}
```

NB: Since this library sets [`fit`](https://docs.imgix.com/apis/url/size/fit) to `crop` by default, when just a width or height is set, the image will resize and maintain aspect ratio. When both are set, the image will be cropped to that size, maintaining pixel aspect ratio (i.e. edges are clipped in order to not stretch the photo). If this isn't desired, set `fit` to be another value (e.g. `clip`)

#### Parameters

You can pass through most of the [params that imgix urls accept](https://docs.imgix.com/apis/url).

Some of the defaults are:

```javascript
path: null, // The path to your image
aspectRatio: null,
crop: null,
fit: 'crop',
onLoad: null,
onError: null,
crossorigin: 'anonymous', // img element crossorigin attr
alt: '', // img element alt attr
draggable: true, // img element draggable attr
options: {}, // arbitrary imgix options

width: null, // override if you want to hardcode a width into the image
height: null, // override if you want to hardcode a height into the image
```

#### Other imgix options

If you want to pass in any other arbitrary imgix options, use the hash helper

```hbs
{{imgix-image
  path='/users/1.png'
  options=(hash
    invert=true
  )
}}
```

#### aspectRatio

This component can also accept an `aspectRatio` parameter:

```hbs
{{imgix-image-element path="/users/1.png" crossorigin="anonymous" aspectRatio=1.33}}
```

#### Lifecycle hooks

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

#### ixlib param

This library adds an `ixlib` parameter to generated image urls for two reasons: a) it helps Imgix support see what versions of libraries that customers are using, and b) it help Imgix to see how many people overall are using the ember library, and the specific versions.

If this behaviour is not desired, it can be turned off in two ways:

1.  Environment config

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

2.  Component parameter

```hbs
{{imgix-image path="/test.png" disableLibraryParam={true} }}
```

### imgix-image-wrapped - DEPRECATED

This component is included to help migration from version 0.x. **This component will be deprecated in version 2. Please use `imgix-image` instead.**

`ember-cli-imgix` exposes a image container that works well for creating responsive images. It is a `<div>` element with a single
`<img>` child element. Adding them to your templates is quite easy:

```hbs
{{imgix-image-wrapped path="/users/1.png"}}
```

The HTML generated by this might look like the following:

```html
<div>
  <img src="https://my-social-network.com/users/1.png?w=400&h=300&dpr=1" />
</div>
```

The `src` attribute will have [imgix URL API parameters](https://www.imgix.com/docs/reference) added to it to perform the resize.

### Imgix Core JS

Imgix core js is available to you shimmed as:

```javascript
import ImgixCoreJs from 'imgix-core-js';
```

## Upgrade Guide

### version 0.x to version 1

`imgix-image` has been replaced by a new implementation of `imgix-image-element`. All usage of `imgix-image-element` can be replaced with `imgix-image`. No parameter changes are necessary.

`imgix-image` has been renamed to `imgix-image-wrapped` and has been deprecated. All usage of `imgix-image` can be replaced with `imgix-image-wrapped` for the duration of version 2. No parameter changes are necessary. After version 2, `imgix-image-wrapped` will not exist.

## version 1.x to version 2.x

The largest change in this major version bump is the move to width-based `srcSet` and `sizes` for responsiveness. This has a host of benefits, including better server rendering, better responsiveness, less potential for bugs, and perfomance improvements.

- A `sizes` prop should be added to all usages of ember-cli-imgix. If `sizes` is new to you (or even if it's not), Eric's [seminal article on `srcset` and `sizes`](https://ericportis.com/posts/2014/srcset-sizes/) is highly recommended.

## Browser Support

- By default, browsers that don't support [`srcset`](http://caniuse.com/#feat=srcset), [`sizes`](http://caniuse.com/#feat=srcset), or [`picture`](http://caniuse.com/#feat=picture) will gracefully fall back to the default `img` `src` when appropriate. If you want to provide a fully-responsive experience for these browsers, ember-cli-imgix works great alongside [Picturefill](https://github.com/scottjehl/picturefill)!
- We support the latest version of Google Chrome (which [automatically updates](https://support.google.com/chrome/answer/95414) whenever it detects that a new version of the browser is available). We also support the current and previous major releases of desktop Firefox, Internet Explorer, and Safari on a rolling basis. Mobile support is tested on the most recent minor version of the current and previous major release for the default browser on iOS and Android (e.g., iOS 9.2 and 8.4). Each time a new version is released, we begin supporting that version and stop supporting the third most recent version.

## Running a test app

To see this in action with some stock photos, clone this repo and then run `ember serve`

```bash
git clone git@github.com:imgix/ember-cli-imgix.git
cd ember-cli-imgix
ember serve
```

Now visit [http://localhost:4200](http://localhost:4200).

## Running Tests

Pretty simple:

```base
ember test
```
