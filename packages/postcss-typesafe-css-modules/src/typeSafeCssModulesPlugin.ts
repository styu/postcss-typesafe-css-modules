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

            const cssModuleExports = [...Object.entries(exportTokens)].map(
                ([tokenName, tokenValue]) => {
                    // postcss-modules automatically picks the last declared name to use in exportTokens
                    // In a scenario where an exported variable and a class name shares the same name,
                    // this can be unexpected so we manually check for conflicts and throw in this scenario
                    const classNameLocation = stylesheet.findClass(tokenName);
                    const variableLocation = stylesheet.findVariable(tokenName);
                    if (classNameLocation != null && variableLocation != null) {
                        throw new Error(
                            `The class name ".${tokenName}" conflicts with an exported variable name with the same name\n    at ${from}:${variableLocation.line}:${variableLocation.column}`,
                        );
                    }
                    return {
                        localVariableName: tokenName,
                        value: tokenValue,
                        variableName: toCamelCase(tokenName),
                        location: classNameLocation ?? variableLocation,
                    };
                },
            );

            const sourceFile = path.relative(path.dirname(to), from);

            // Generate the JavaScript file
            const js = new SourceNode(null, null, sourceFile, [
                `import "./${path.basename(to)}";\n\n`,
                ...cssModuleExports.flatMap(el => [
                    new SourceNode(null, null, sourceFile, `export const `),
                    new SourceNode(
                        el.location?.line ?? null,
                        el.location?.column ?? null,
                        sourceFile,
                        `${el.variableName} = "${el.value}";\n`,
                    ),
                ]),
                `export default { ${cssModuleExports
                    .map(el => el.variableName)
                    .join(", ")} };\n`,
            ]).toStringWithSourceMap();

            // Generate the TypeScript .d.ts file
            const dts = new SourceNode(null, null, sourceFile, [
                ...cssModuleExports.flatMap(el => {
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
                ...cssModuleExports.flatMap(el => [
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

function replaceModuleExtension(filePath: string) {
    const dirname = path.dirname(filePath);
    const originalFileName = path.basename(filePath);
    // Output with a leading underscore in the hopes of preventing conflicts with non-module files
    // The hope is that Sass treats .scss files with leading underscores as partials and won't compile them to CSS,
    // so the chances of conflicts should be low.
    return `${dirname}/_${originalFileName.replace(".module.css", ".css")}`;
}
