import { ICoverage, IParser, ICoverageFragment, CoverageColor, ICoverageReport } from './../types';
import path from 'path';
import zipWith from 'lodash/zipWith';
import { CoverageFragment } from '../helpers/coverageFragment';
import { CoverageCollection } from '../helpers/coverageCollection';
import { CoverageFlatFragment } from '../helpers/coverageFlatFragmet';


export class IstanbulParser implements IParser {
    public readonly name = 'istambul';
    public readonly priority = 20;

    constructor(private content: string, private folder: string) { }

    public static testFormat(ext: string, firstChunk: string): boolean {
        if (ext !== '.json') {
            return false;
        }
        return firstChunk.indexOf('"path":') !== -1;
    }

    public async getReport(): ICoverageReport {
        // https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md
        const content = JSON.parse(this.content);
        const all: ICoverage[] = [];
        for (const coverage of this.parse(content)) {
            all.push(coverage);
        }

        return all;
    }

    private *parse(content: object[]): ICoverage {
        for (const entry of Object.values(content)) {
            let filePath: string = entry.path;
            if (!path.isAbsolute(filePath)) {
                filePath = path.join(this.folder, filePath);
            }

            // filePath.indexOf('phpParser.ts') !== -1
            const branches = this.makeCollection(entry.b, entry.branchMap, 'locations');
            const statements = this.makeCollection(entry.s, entry.statementMap);
            const functions = this.makeCollection(entry.f, entry.fnMap, 'loc');

            const coverage = new CoverageCollection();
            coverage
                .merge(branches)
                .merge(statements)
                .merge(functions)
                .normalize();

            // Add green bg layer
            const bgCollection = new CoverageCollection();
            for (const i of coverage.items) {
                if (i.color === CoverageColor.GREEN) {
                    bgCollection.addItem(new CoverageFlatFragment({start: {line: i.start.line}, end: {line: i.end.line}, color: CoverageColor.GREEN_BG, note: i.note}));
                }
            }
            bgCollection.normalize();
            coverage.merge(bgCollection);

            const tooltips = [
                `Statements: ${Math.ceil(statements.stat.covered * 100 / statements.stat.total)}% (${statements.stat.covered}/${statements.stat.total})`,
                `Branches: ${Math.ceil(branches.stat.covered * 100 / branches.stat.total)}% (${branches.stat.covered}/${branches.stat.total})`,
                `Functions: ${Math.ceil(functions.stat.covered * 100 / functions.stat.total)}% (${functions.stat.covered}/${functions.stat.total})`
            ];

            let percent = 100;
            const covered = branches.stat.covered + statements.stat.covered + functions.stat.covered;
            const total = branches.stat.total + statements.stat.total + functions.stat.total;
            if (total > 0) {
                percent = Math.ceil(covered * 100 / total);
            }

            const ret: ICoverage = {
                priority: this.priority,
                file: filePath,
                stat: {
                    label: `${percent}%`,
                    tooltip: tooltips.join('\n')
                },
                fragments: coverage.dump(),
                withGreenBg: true
            };
            yield ret;
        }
    }

    private makeCollection(ids: objest[], map_: object[], locationName?: string) {
        const collection = new CoverageCollection();
        for (const blockId of Object.keys(ids)) {
            let blockCounts = ids[blockId];
            let locations;

            if (!locationName) {
                locations = map_[blockId];
            } else {
                locations = (map_[blockId] || {})[locationName];
            }

            if (!Array.isArray(locations)) {
                locations = [locations];
            }
            if (!Array.isArray(blockCounts)) {
                blockCounts = [blockCounts];
            }
            // verify locations has start and end with line and column
            zipWith(locations, blockCounts, (a, b) => {
                if (a.start.line < 1 || a.end.line < 1) {
                    return;
                }
                // Sometimes start and end could contain warning values
                if (a.start.line === a.end.line && a.start.column > a.end.column) {
                    [a.start, a.end] = [a.end, a.start];
                }
                const props: ICoverageFragment = {
                    // make 0-based lines:
                    start: {line: a.start.line - 1, column: a.start.column},
                    end: {line: a.end.line - 1, column: a.end.column},
                    color: b > 0 ? CoverageColor.GREEN : CoverageColor.RED
                };

                const fragment = new CoverageFragment(props);
                collection.addItem(fragment);
            });
        }
        return collection;
    }
}
