
declare module 'cobertura-parse' {
    import {LCov as CobCov} from 'lcov-parse';
    export function parseContent(content: string, callback: (err: any, result: CobCov.CoverageCollection) => any, absPath: boolean): void;

    /**
     * Copied with modifications from https://github.com/markis/vscode-code-coverage/blob/master/src/coverage-info.ts
     */
    // export {LCov as CobCov} from "lcov-parse";
    export {CobCov};

}
