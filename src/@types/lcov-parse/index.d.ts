
declare module 'lcov-parse' {
    export default function parse(content: string, callback: (err: any, result: LCov.CoverageCollection) => any): void;

    /**
     * Copied with modifications from https://github.com/markis/vscode-code-coverage/blob/master/src/coverage-info.ts
     */
    export namespace LCov {
        export type CoverageCollection = Coverage[];

        export interface Coverage {
            branches: CoverageInfoCollection<BranchCoverageInfo>;
            functions: CoverageInfoCollection<FunctionCoverageInfo>;
            lines: CoverageInfoCollection<LineCoverageInfo>;
            title: string;
            file: string;
        }

        export interface CoverageInfoCollection<T> {
            found: number;
            hit: number;
            details: T[];
        }

        export interface LineCoverageInfo {
            hit: number;
            line: number;
        }

        export interface BranchCoverageInfo {
            block: number;
            branch: number;
            line: number;
            taken: number;
        }

        export interface FunctionCoverageInfo {
            hit: number;
            line: number;
            name: string;
        }
    }
}
