import * as childProcess from "child_process";
import path from "path";


let exitCode = 0;
const cwd = process.cwd();

// From https://github.com/Dart-Code/Dart-Code/blob/master/test/test_all.ts
const timeoutInMilliseconds = 1000 * 60 * 30;
function runNode(command: string, args: string[], env?: any, cwd_?: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        let timerWarn: NodeJS.Timer;
        let timerKill: NodeJS.Timer;
        
        if (!env) {
            env = Object.create(process.env);
        }
        if (!cwd_) {
            cwd_ = cwd;
        }
        console.log('Run %s %s', command, args.join(' '));
        
        const proc = childProcess.spawn(command, args, { env, stdio: "inherit", cwd: cwd_ });
        
        proc.on("data", (data: Buffer | string) => console.log(data.toString()));
        proc.on("error", (data: Buffer | string) => console.warn(data.toString()));
        proc.on("close", (code: number) => {
            if (timerWarn)
                clearTimeout(timerWarn);
            if (timerKill)
                clearTimeout(timerKill);
            resolve(code);
        });
        timerWarn = setTimeout(() => {
            if (!proc || proc.killed)
                return;
            console.log(`Process is still going after ${timeoutInMilliseconds / 2 / 1000}s.`);
            console.log(`Waiting another ${timeoutInMilliseconds / 2 / 1000}s before terminating`);
            console.log("    " + JSON.stringify(args));
        }, timeoutInMilliseconds / 2);
        timerKill = setTimeout(() => {
            if (!proc || proc.killed)
                return;
            proc.kill();
            console.log(`Terminating process for taking too long after ${timeoutInMilliseconds / 1000}s!`);
            console.log("    " + JSON.stringify(args));
            // We'll throw and bring the tests down here, because when this happens, the Code process doesn't
            // get terminated (only the node wrapper) so subsequent tests fail anyway.
            reject("Terminating test run due to hung process.");
        }, timeoutInMilliseconds);
    });
}

async function runVscodeTests(): Promise<void> {
    const coverageDir = path.join(cwd, '.nyc_output');
    const env = Object.create(process.env);

    env.CODE_TESTS_PATH = path.join(cwd, 'out', 'test', 'vscodeTests');
    env.COVERAGE_OUTPUT = path.join(coverageDir, `${Math.random()}.json`);
    await runNode('node', ["node_modules/vscode/bin/test"], env);
}

async function runMochaTests(): Promise<void> {

    const coverageDir = path.join(cwd, '.nyc_output');
    const env = Object.create(process.env);

    env.CODE_TESTS_PATH = path.join(cwd, 'out', 'test', 'unitTests');
    env.COVERAGE_OUTPUT = path.join(coverageDir, `${Math.random()}.json`);

    await runNode('node', ["out/test/unitTests/index.js"], env);
}

async function runAllTests(): Promise<void> {
    try {
        await runVscodeTests();
        await runMochaTests();
    } catch (e) {
        exitCode = 1;
        console.error(e);
    }
}


runAllTests().then(() => process.exit(exitCode));
