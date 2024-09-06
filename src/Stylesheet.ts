/*
 * (c) Copyright 2024 Walker Burgin. All rights reserved.
 */

import { LinesAndColumns, type SourceLocation } from "lines-and-columns";

export class Stylesheet {
    private classIndex: Map<string, SourceLocation | undefined>;
    private variablesIndex: Map<string, SourceLocation | undefined>;

    public constructor(source: string) {
        const stylesheet = new LinesAndColumns(source);
        this.classIndex = new Map(
            [...source.matchAll(/\.(?<className>[\w-]+)\s+{/g)]
                .filter(match => match.index != null)
                .map(match => {
                    const location =
                        stylesheet.locationForIndex(match.index!) ?? undefined;
                    if (location != null) {
                        location.line = location.line + 1;
                    }
                    return [match.groups?.className!, location] as const;
                }),
        );

        // To make sure we don't catch Sass variable declartions, we only look between :export {}
        const variableExports = source.match(/:export\s*{\s*([^}]+)}/);
        if (variableExports == null || variableExports.length < 2) {
            this.variablesIndex = new Map();
        } else {
            const [variableExportsMatch, exportedVariables] = variableExports;
            const offset =
                variableExports.index! +
                variableExportsMatch.indexOf(exportedVariables);
            this.variablesIndex = new Map(
                [...exportedVariables.matchAll(/(?<variableName>[\w-]+)\s*:/g)]
                    .filter(match => match.index != null)
                    .map(match => {
                        const location =
                            stylesheet.locationForIndex(
                                match.index! + offset,
                            ) ?? undefined;
                        if (location != null) {
                            location.line = location.line + 1;
                        }
                        return [match.groups?.variableName!, location] as const;
                    }),
            );
        }
    }

    public findClass(
        className: string,
    ): { line: number; column: number } | undefined {
        return this.classIndex.get(className);
    }

    public findVariable(
        variableName: string,
    ): { line: number; column: number } | undefined {
        return this.variablesIndex.get(variableName);
    }
}
