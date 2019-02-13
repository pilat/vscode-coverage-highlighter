// @ts-ignore: We haven't declaration
import lcovParse from 'lcov-parse';

import { ICoverage, ICoverageReport, IParser, ICoverage, ICoverageFragments, CoverageColor, ICoverageFragment } from './../types';
import * as path from 'path';

import { CoverageCollection } from '../helpers/coverageCollection';
import { CoverageFlatFragment } from '../helpers/coverageFlatFragmet';


export class LcovParser implements IParser {
    public readonly name = 'lcov';
    public readonly priority = 10;

    constructor(private content: string, private folder: string) { }

    public static testFormat(ext: string, firstChunk: string): boolean {
        if (ext !== '.info') {
            return false;
        }
        return firstChunk.indexOf('TN:') !== -1 && firstChunk.indexOf('SF:') !== -1;
    }

    public async getReport(): ICoverageReport {
        const content = await this.getLcovData();
        const all: ICoverage[] = [];
        for (const coverage of this.parse(content)) {
            all.push(coverage);
        }

        return all;
    }

    public *parse(content: object): ICoverage {
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

            const lines = this.makeCollection(entry.lines);
            const branches = this.makeCollection(entry.branches);
            const functions = this.makeCollection(entry.functions);

            const coverage = new CoverageCollection();
            coverage
                .merge(lines)
                .merge(branches)
                .merge(functions)
                .normalize();

            let percent = 100;
            if (coverage.stat.covered > 0) {
                percent = Math.ceil(coverage.stat.covered * 100 / coverage.stat.total);
            }

            const ret: ICoverage = {
                priority: this.priority,
                file: filePath,
                stat: {
                    label: `${percent}%`
                },
                fragments: coverage.dump()
            };
            yield ret;
        }
    }

    async private getLcovData() {
        return new Promise((resolve, reject) => {
            lcovParse(this.content, (err: string, result: object[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    private makeCollection(info: object): ICoverageFragments {
        const collection = new CoverageCollection();
        for (const detail of info.details) {
            const props: ICoverageFragment = {
                // zero-based lines we need
                start: {line: detail.line - 1},
                end: {line: detail.line - 1},
                color: detail.hit > 0 ? CoverageColor.GREEN : CoverageColor.RED
            };
            const fragment = new CoverageFlatFragment(props);
            collection.addItem(fragment);
        }

        return collection;
    }
}
