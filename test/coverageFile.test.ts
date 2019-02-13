import { ICoverageFile } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import fs from 'fs';
import { join } from 'path';
import { CoverageFile } from '../src/coverageFile';
import { sleep, FILES_DIR } from './common';
import {mock, restore} from 'simple-mock';


let token: vscode.CancellationTokenSource;

async function getFile(filename: string) {
    const coverageFile: ICoverageFile = { folder: FILES_DIR, uri: join(FILES_DIR, filename) };
    token = new vscode.CancellationTokenSource();

    return new CoverageFile(coverageFile, token.token);
}


suite('CoverageFile Tests', () => {
    test('Read non-existing file', async () => {
        const f = await getFile('file_not_found');
        await f.parse();
        assert.equal(f.hasError, true);
    });

    for (const file of ['rand.txt', 'zero.txt']){
        test(`Read existing, but invalid file ${file}`, async () => {
            const f = await getFile(file);
            await f.parse();
            assert.equal(f.hasError, true);
        });
    }

    for (const file of ['lcov.info', 'cov.xml']){
        test(`Read valid file ${file}`, async () => {
            const f = await getFile(file);
            await f.parse();
            assert.equal(f.hasError, false);
        });
    }

    test('Read report', async () => {
        const f = await getFile('lcov.info');
        await f.parse();
        assert.ok(f.report.length > 0);
        assert.ok(f.report[0].fragments.length > 0);
    });

    test('Test broke reading', async() => {
        mock(fs, 'createReadStream', () => {
            const listeners: Map<string, any> = new Map();
            const o = {
                on: (event: string, listener: (...args: any[]) => void) => {
                    listeners.set(event, listener.bind(this));
                },
                close: () => {
                    // do "error"
                    listeners.get('error')();
                }
            };
            setTimeout(() => {
                listeners.get('data')('12345....');
            }, 50);
            return o;
        });

        const f = await getFile('lcov.info');
        f.parse(); // no wait
        await sleep(10);
        token.cancel();
        await sleep(100);

        assert.equal(f.hasError, true);

        restore();
    });
});
