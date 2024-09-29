import { typeSafeCssModulesPlugin } from "./typeSafeCssModulesPlugin.js";

// @ts-ignore - This will error in the IDE because it sees "type": "module" in package.json
//              and tries to interpret this as an ES module, even with the ".cts" extension.
//              At build time we add a nested package.json file to the commonjs output
//              directory that specifies "type": "commonjs" to ensure that for consumers this
//              is interpreted as commonjs.
export = typeSafeCssModulesPlugin;