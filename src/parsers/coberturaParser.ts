// @ts-ignore: We haven't declaration
import { parseContent } from 'cobertura-parse';


import { ICoverage, ICoverageReport, IParser } from './../types';
import { LcovParser } from './lcovParser';


export class CoberturaParser extends LcovParser implements IParser {
    public readonly name = 'cobertura';
    public readonly priority = 10;

    constructor(private content: string, private folder: string) {
        super(content, folder);
    }

    public static testFormat(ext: string, firstChunk: string): boolean {
        if (ext !== '.xml') {
            return false;
        }
        return firstChunk.indexOf('<coverage') !== -1 && firstChunk.indexOf('lines-covered') !== -1;
    }

    public async getReport(): ICoverageReport {
        const content = await this.getData();
        const all: ICoverage[] = [];
        for (const coverage of this.parse(content)) {
            all.push(coverage);
        }

        return all;
    }

    async private getData() {
        return new Promise((resolve, reject) => {
            parseContent(this.content, (err: string, result: object[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }, true);
        });
    }
}
