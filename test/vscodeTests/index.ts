import * as testRunner from 'vscode/lib/testrunner';
import {afterTestsHook} from '../coverageHook'

testRunner.configure({
    ui: 'tdd',
    useColors: true,
    timeout: 240000,
    slow: 5000
});

// Inject finish hook to original vscode runner
const originalRunner = (testRunner as any).run;
(testRunner as any).run = (testsRoot: string, clb: any) => {
    const newCallback = () => {
        afterTestsHook();
        clb();
    }
    originalRunner(testsRoot, newCallback);
}
module.exports = testRunner;


