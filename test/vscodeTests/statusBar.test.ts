import { Flux } from '../../src/flux/flux';
import { AppAction, ICoverageFile, ICoverageStat } from '../../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore } from './common';
import { StatusBarManager } from '../../src/statusBarManager';
import { StatusBarItemStub } from './stubs/statusBar.stub';


suite('StatusBar Tests', () => {
    let component: StatusBarManager;
    let barStub: StatusBarItemStub;

    function addCoverageFile() {
        const coverageFile: ICoverageFile = {
            uri: 'fsPath',
            folder: 'folder'
        };
        Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile});
    }
    
    function addCoverageStat() {
        const stat: ICoverageStat = {
            label: 'SOME_LABEL',
            tooltip: 'SOME_TOOLTIP'
        };
        Flux.dispatch({type: AppAction.UPDATE_COVERAGE_STAT, stat});
    }    

    setup(async () => {
        await getTestStore();

        barStub = new StatusBarItemStub();

        // @ts-ignore Setup StatusBar
        component = new StatusBarManager(barStub);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        component.dispose();
    });

    test('Ensure that bar has been created', () => {
        assert.ok(barStub.text);
        assert.ok(!barStub._show);
    });

    test('Show "loading" when tasks are running', async () => {
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash: 'workId#1'});
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash: 'workId#2'});
        assert.equal(barStub._show, true);
        assert.equal(barStub.text, '$(repo-sync)');

        Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash: 'workId#1'});
        assert.equal(barStub._show, true);

        Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash: 'workId#2'});
        assert.equal(barStub._show, false);
    });

    test('Show icon when coverage was discovered', async() => {
        addCoverageFile();
        assert.equal(barStub._show, true);
        assert.equal(barStub.text, '$(eye)');
    });

    test('Show coverage stat', async() => {
        addCoverageFile();
        addCoverageStat();

        assert.equal(barStub._show, true);
        assert.equal(barStub.text.indexOf('SOME_LABEL') !== -1, true);
        assert.equal(barStub.tooltip.indexOf('SOME_TOOLTIP') !== -1, true);
    });

    test('Toggle coverage: display off', async() => {
        addCoverageFile();
        addCoverageStat();
        assert.notStrictEqual(barStub.command, undefined);

        await vscode.commands.executeCommand(barStub.command);
        await sleep();
        assert.equal(barStub._show, true);  // Still true
        assert.equal(barStub.text.indexOf('$(eye-closed)') !== -1, true);
    });
});
