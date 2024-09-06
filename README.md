# postcss-typesafe-css-modules

A [PostCSS](https://postcss.org/) plugin for type safe [CSS modules](https://github.com/css-modules/css-modules) by tapping into the [postcss-modules](https://github.com/madyankin/postcss-modules) plugin.

## Overview

This plugin takes CSS modules one step further by generating `.js` and `.d.ts` files for each CSS module file. This means that CSS class names imported from a CSS module file will be typechecked so that developers can't reference non-existent classes. Source maps are also generated so that you can navigate from a CSS module class name directly to the Sass file.

For example, if you have the following SCSS module file:

```css
// header.module.scss
$page-width: 850px;

:export {
    pageWidth: $page-width;
}

.header {
    font-size: 1.5rem;
}
```

In your corresponding TypeScript file, the following would work:

```tsx
import React from "react";
import * as css from "./header.module.scss";

export const Header: React.FC = () => {
    const width = css.pageWidth; // "850px"
    return <header className={css.header}>Hello</header>;
};
```

However, referencing a non-existent class will fail to compile:

```tsx
import React from "react";
import * as css from "./header.module.scss";

export const Header: React.FC = () => {
    // Will fail to compile
    return <header className={css.nonExistent}>Hello</header>;
};
```

Note that if there is a naming conflict between an exported variable (via `:export`) and a class name, this plugin will throw to prevent surprising behavior:

```css
// header.module.scss
$header-width: 850px;

:export {
    // Will cause an error
    header: $header-width;
}

.header {
    font-size: 1.5rem;
}
```

## Usage

Add this plugin to your build tool, along with the [SCSS parser](https://github.com/postcss/postcss-scss).

```
npm install postcss postcss-scss postcss-typesafe-css-modules --save-dev
```

### PostCSS

In the following example, we are compiling Sass via PostCSS as well:

```js
// postcss.config.mjs
import scssPlugin from "@csstools/postcss-sass";
import scss from "postcss-scss";
import cssModulesPlugin from "postcss-typesafe-css-modules";

export default {
    syntax: scss,
    plugins: [scssPlugin(), cssModulesPlugin],
};
```

Alternatively, in CommonJS:

```js
// postcss.config.js
module.exports = {
    syntax: require("postcss-scss"),
    plugins: [
        require("@csstools/postcss-sass")(),
        require("postcss-typesafe-css-modules").default,
    ],
};
```

For each SCSS module file, the following files will get written to disk in the output directory (`--dir` if using the [postcss-cli](https://github.com/postcss/postcss-cli)):

```
# In this example, build/postcss is the output directory for PostCSS
src/
  hello.module.scss
  hello.tsx                   # Contains the import for header.module.scss
build/
  postcss/
    _hello.module.css         # Compiled CSS that is imported by hello.module.scss.js
    hello.module.scss.js      # File actually imported by hello.tsx
    hello.module.scss.js.map
    hello.module.scss.d.ts
    hello.module.scss.d.ts
```

## Options

Currently this plugin has one option, forwarded to postcss-modules. See [Generating scoped names](https://www.npmjs.com/package/postcss-modules#generating-scoped-names) for how to configure this option:

```js
import cssModulesPlugin from "postcss-typesafe-css-modules";
cssModulesPlugin.default({
    generateScopedName: /* Your desired scoped name behavior */
})
```
