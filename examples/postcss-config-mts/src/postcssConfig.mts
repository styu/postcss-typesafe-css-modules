import postcssPresetEnv from "postcss-preset-env";
import postcssTypeSafeCssModules from "postcss-typesafe-css-modules";

export function postcssConfig(ctx: {
    file: { basename: string };
    options: { map: boolean };
}): unknown {
    const plugins = [
        // Enable modern CSS features
        // https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env
        postcssPresetEnv(),
        postcssTypeSafeCssModules(),
    ];

    return {
        map: ctx.options.map,
        plugins,
    };
}
