import type { PluginCreator } from "postcss";
import { SourceNode } from "source-map";
import { Stylesheet } from "./Stylesheet.js";
import path from "node:path";
import fs from "fs-extra";
import postcssModules from "postcss-modules";

interface TypeSafeCssModulesPluginOptions {
    generateScopedName?:
        | string
        | ((name: string, filename: string, css: string) => string);
}

export const typeSafeCssModulesPlugin: PluginCreator<
    TypeSafeCssModulesPluginOptions
> = (opts = {}) => {
    const cssModules = postcssModules({
        generateScopedName: opts.generateScopedName,
        localsConvention: (className: string) => className,
        getJSON: async (from, exportTokens, to) => {
            if (to == null) {
                throw new Error(
                    "Could not determine CSS module output file location",
                );
            }

            // Index the stylesheet so that we can lookup lines & columns
            const stylesheet = new Stylesheet(await fs.readFile(from, "utf8"));

            const classes = [...Object.entries(exportTokens)].map(
                ([localClassName, scopedClassName]) => ({
                    localClassName,
                    scopedClassName,
                    variableName: toCamelCase(localClassName),
                    location: stylesheet.findClass(localClassName),
                }),
            );

            const sourceFile = path.relative(path.dirname(to), from);

            // Replace .module.css with .css, since at this point it is no longer a CSS module
            // This prevents consumers from potentially double-compiling CSS modules (looking at you NextJS)
            const outputFileWithoutModuleExtension = replaceModuleExtension(
                path.basename(to),
            );
            // Generate the JavaScript file
            const js = new SourceNode(null, null, sourceFile, [
                `import "./${outputFileWithoutModuleExtension}";\n\n`,
                ...classes.flatMap(el => [
                    new SourceNode(null, null, sourceFile, `export const `),
                    new SourceNode(
                        el.location?.line ?? null,
                        el.location?.column ?? null,
                        sourceFile,
                        `${el.variableName} = "${el.scopedClassName}";\n`,
                    ),
                ]),
                `export default { ${classes
                    .map(el => el.variableName)
                    .join(", ")} };\n`,
            ]).toStringWithSourceMap();

            // Generate the TypeScript .d.ts file
            const dts = new SourceNode(null, null, sourceFile, [
                ...classes.flatMap(el => {
                    return [
                        new SourceNode(
                            null,
                            null,
                            sourceFile,
                            `export declare const `,
                        ),
                        new SourceNode(
                            el.location?.line ?? null,
                            el.location?.column ?? null,
                            sourceFile,
                            `${el.variableName}: string;\n`,
                        ),
                    ];
                }),
                "\n",
                `declare const `,
                new SourceNode(1, 0, sourceFile, `__defaultExports: {\n`),
                ...classes.flatMap(el => [
                    ` `,
                    new SourceNode(
                        el.location?.line ?? null,
                        el.location?.column ?? null,
                        sourceFile,
                        `${el.variableName}: string;\n`,
                    ),
                ]),
                `};\n`,
                `export default __defaultExports;`,
            ]).toStringWithSourceMap({ file: `${path.basename(from)}.d.ts` });

            // Write everything out to disk
            await Promise.all([
                fs.outputFile(
                    path.join(path.dirname(to), `${path.basename(from)}.js`),
                    js.code,
                ),
                fs.outputFile(
                    path.join(
                        path.dirname(to),
                        `${path.basename(from)}.js.map`,
                    ),
                    js.map.toString(),
                ),
                fs.outputFile(
                    path.join(path.dirname(to), `${path.basename(from)}.d.ts`),
                    dts.code,
                ),
                fs.outputFile(
                    path.join(
                        path.dirname(to),
                        `${path.basename(from)}.d.ts.map`,
                    ),
                    dts.map.toString(),
                ),
            ]);
        },
    });
    const previousOnceExitFunction = cssModules.OnceExit;
    cssModules.OnceExit = (root, helper) => {
        // First do whatever postcss-modules may have configured to prevent dropping behavior
        previousOnceExitFunction?.(root, helper);
        // Now rename the file as a last action
        const originalOutputFile = helper.result.opts.to;
        if (originalOutputFile?.endsWith(".module.css")) {
            // We need to output `.css` since the generated .js file will import it
            // This is strictly more correct, since after compiling the sass module it is no longer a CSS module
            helper.result.opts.to = replaceModuleExtension(originalOutputFile);
        }
    };
    return cssModules;
};
typeSafeCssModulesPlugin.postcss = true;

function toCamelCase(str: string) {
    return str.replace(/-./g, x => x[1].toUpperCase());
}

function replaceModuleExtension(path: string) {
    return path.replace(/\.module\.css$/, ".css");
}
