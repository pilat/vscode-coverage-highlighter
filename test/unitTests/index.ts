'use strict';


import glob from 'glob';
import {afterTestsHook} from '../coverageHook'
import * as path from 'path';


const Mocha = require('mocha');
const tty = require('tty');
if (!tty.getWindowSize) {
    tty.getWindowSize = (): number[] => {
        return [80, 75];
    };
}

let mocha = new Mocha({
    ui: 'bdd',
    useColors: true,
    timeout: 240000,
    slow: 5000
});


const testsRoot = process.env.CODE_TESTS_PATH;

glob('**/**.test.js', { cwd: testsRoot }, (error, files): any => {
    if (error) {
        console.warn('Error', error)
        return;
    }
    try {
        // Fill into Mocha
        files.forEach((f): Mocha => {
            return mocha.addFile(path.join(testsRoot, f));
        });
        // Run the tests
        mocha
            .run()
            .on('fail', (): void => {
            // failureCount++;
            })
            .on('end', (): void => {
                console.log('Complete!')
                afterTestsHook()
            });
    } catch (error) {
        console.warn('Error', error);
        return;
    }
});
