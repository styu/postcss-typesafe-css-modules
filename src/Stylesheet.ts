/*
 * (c) Copyright 2024 Walker Burgin. All rights reserved.
 */

import { LinesAndColumns, type SourceLocation } from "lines-and-columns";

export class Stylesheet {
    private index: Map<string, SourceLocation | undefined>;

    public constructor(source: string) {
        const stylesheet = new LinesAndColumns(source);
        this.index = new Map(
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
    }

    public findClass(
        className: string,
    ): { line: number; column: number } | undefined {
        return this.index.get(className);
    }
}
