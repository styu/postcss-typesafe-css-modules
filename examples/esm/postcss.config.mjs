// @ts-check
import scssPlugin from "@csstools/postcss-sass";
import scss from "postcss-scss";
import cssModulesPlugin from "postcss-typesafe-css-modules";

export default {
    syntax: scss,
    plugins: [scssPlugin(), cssModulesPlugin],
};
