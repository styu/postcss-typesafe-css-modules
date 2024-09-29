module.exports = {
    syntax: require("postcss-scss"),
    plugins: [
        require("@csstools/postcss-sass")(),
        require("postcss-typesafe-css-modules"),
    ],
};
