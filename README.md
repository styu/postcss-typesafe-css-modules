# postcss-typesafe-css-modules

A [PostCSS](https://postcss.org/) plugin for type safe [CSS modules](https://github.com/css-modules/css-modules) by tapping into the [postcss-modules](https://github.com/madyankin/postcss-modules) plugin.

## Overview

This plugin takes CSS modules one step further by generating `.js` and `.d.ts` files for each CSS module file. This means that CSS class names imported from a CSS module file will be typechecked so that developers can't reference non-existent classes.

For example, if you have the following CSS module file:

```css
// header.module.css
.header {
    font-size: 1.5rem;
}
```

In your corresponding TypeScript file, the following would work:

```tsx
import React from "react";
import * as css from "./header.module.css";

export const Header: React.FC = () => {
    return <header className={css.header}>Hello</header>;
};
```

However, referencing a non-existent class will fail to compile:

```tsx
import React from "react";
import * as css from "./header.module.css";

export const Header: React.FC = () => {
    // Will fail to compile
    return <header className={css.nonExistent}>Hello</header>;
};
```

## Usage

// Todo
