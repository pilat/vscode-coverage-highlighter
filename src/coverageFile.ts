import { ICoverageReport, ICoverageFile, TParser, IParser } from './types';
import { ParsersCollection } from './parsers/parsersCollection';
import { CancellationToken } from 'vscode';
import fs from 'fs';
import { extname } from 'path';


const FILE_READ_OPTIONS = {flag: 'r', encoding: 'utf8', autoClose: true, highWaterMark: 2 * 1024};

export class CoverageFile {
    private static parsersCollection = new ParsersCollection();

    private _hasError: boolean = false;
    private _report: ICoverageReport;

    constructor(private file: ICoverageFile, private token: CancellationToken) { }

    public parse(): Promise<void> {
        return new Promise((resolve) => {
            this.getParser()
                .then((parser) => parser.getReport())
                .then((report) => {
                    this._report = report;
                    resolve();
                })
                .catch(() => {
                    this._hasError = true;
                    resolve();
                });
        });
    }

    private getParser(): Promise<IParser> {
        const ext = extname(this.file.uri.toLocaleLowerCase());
        let suitableParser: TParser|undefined;
        let content: string = '';

        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(this.file.uri, FILE_READ_OPTIONS);
            stream.on('data', chunk => {
                if (this.token.isCancellationRequested) {
                    stream.close();  // stop reading
                    return;
                }
                // when it is a first chunk, try to find parser and then still reads
                if (!suitableParser) {
                    suitableParser = CoverageFile.parsersCollection.find(ext, chunk);
                    if (!suitableParser) {
                        stream.close();  // stop reading
                    }
                }
                content += chunk;
            });
            stream.on('error', () => {
                reject();
            });
            stream.on('close', () => {
                if (!suitableParser) {
                    reject();
                }
            });
            stream.on('end', () => {
                if (suitableParser) {
                    const parser = new suitableParser(content, this.file.folder);
                    resolve(parser);
                } else {
                    reject();
                }
            });
        });
    }

    public get hasError() {
        return this._hasError;
    }

    public get report() {
        return this._report;
    }
}
