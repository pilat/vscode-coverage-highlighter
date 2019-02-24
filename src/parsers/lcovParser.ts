// import * as lcovParse from 'lcov-parse';
import lcovParse, { LCov } from 'lcov-parse';


import { ICoverageReport, IParser, ICoverage, CoverageColor, ICoverageCollection, ICoverageFragmentBase, IParserInfo } from './../types';
import * as path from 'path';

import { CoverageCollection } from '../helpers/coverageCollection';
import { CoverageFlatFragment } from '../helpers/coverageFlatFragmet';


export class LcovParser implements IParser {
    constructor(protected content: string, protected folder: string) { }

    public getInfo(): IParserInfo {
        return {
            name: 'lcov',
            priority: 10,
            hasAdditionalColor: false
        }
    }

    public static testFormat(ext: string, firstChunk: string): boolean {
        if (ext !== '.info') {
            return false;
        }
        return firstChunk.indexOf('TN:') !== -1 && firstChunk.indexOf('SF:') !== -1;
    }

    public async getReport(): Promise<ICoverageReport> {
        const content = await this.getLcovData();
        const all: ICoverage[] = [];

        for (const coverage of this.parse(content)) {
            all.push(coverage);
        }

        return all;
    }

    public *parse(content: LCov.CoverageCollection): IterableIterator<ICoverage> {
        for (const entry of content) {
            let filePath: string = entry.file;
            if (!path.isAbsolute(filePath)) {
                filePath = path.join(this.folder, filePath);
            }

            if (!entry.hasOwnProperty('lines') || !entry.hasOwnProperty('branches') ||
                !entry.hasOwnProperty('functions') || !entry.lines.hasOwnProperty('details') ||
                !entry.branches.hasOwnProperty('details') || !entry.functions.hasOwnProperty('details')) {
                    throw new Error('Error format');
            }

            const lines = this.makeCollection<LCov.LineCoverageInfo>(entry.lines.details,
                (o) => ({line: o.line, taken: o.hit > 0}));
            const branches = this.makeCollection<LCov.BranchCoverageInfo>(entry.branches.details,
                (o) => ({line: o.line, taken: !!o.taken}));
            const functions = this.makeCollection<LCov.FunctionCoverageInfo>(entry.functions.details,
                (o) => ({line: o.line, taken: o.hit > 0}));

            const coverage = new CoverageCollection();
            coverage
                .merge(lines)
                .merge(branches)
                .merge(functions)
                .normalize();

            let percent = 100;
            if (coverage.stat.total > 0) {
                percent = Math.ceil(coverage.stat.covered * 100 / coverage.stat.total);
            }

            const ret: ICoverage = {
                file: filePath,
                stat: {
                    label: `${percent}%`
                },
                fragments: coverage.dump(),
                parserInfo: this.getInfo()
            };
            yield ret;
        }
    }

    private makeCollection<T>(details: T[], callback: (e: T) => ({line: number, taken: boolean})): ICoverageCollection {
        const collection = new CoverageCollection();
        for (const detail of details) {
            const info = callback(detail);
            const props: ICoverageFragmentBase = {
                // zero-based lines we need
                start: {line: info.line - 1},
                end: {line: info.line - 1},
                color: info.taken ? CoverageColor.GREEN : CoverageColor.RED
            };

            const fragment = new CoverageFlatFragment(props);
            collection.addItem(fragment);
        }

        return collection;
    }

    private getLcovData(): Promise<LCov.CoverageCollection> {
        return new Promise((resolve, reject) => {
            lcovParse(this.content, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}
