import { parseContent, CobCov } from 'cobertura-parse';


import { ICoverage, ICoverageReport, IParser } from './../types';
import { LcovParser } from './lcovParser';


export class CoberturaParser extends LcovParser implements IParser {
    public name = 'cobertura';
    public priority = 10;

    constructor(content: string, folder: string) {
        super(content, folder);
    }

    public static testFormat(ext: string, firstChunk: string): boolean {
        if (ext !== '.xml') {
            return false;
        }
        return firstChunk.indexOf('<coverage') !== -1 && firstChunk.indexOf('lines-covered') !== -1;
    }

    public async getReport(): Promise<ICoverageReport> {
        const content = await this.getCobData();
        const all: ICoverage[] = [];

        for (const coverage of this.parse(content)) {
            all.push(coverage);
        }

        return all;
    }

    private getCobData(): Promise<CobCov.CoverageCollection> {
        return new Promise((resolve, reject) => {
            parseContent(this.content, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }, true);
        });
    }
}
