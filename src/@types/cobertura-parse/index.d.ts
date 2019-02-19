
declare module 'cobertura-parse' {
    import {LCov as CobCov} from 'lcov-parse';

    export function parseContent(content: string,
        callback: (err: any, result: CobCov.CoverageCollection) => any, absPath: boolean): void;

    export {CobCov};
}
