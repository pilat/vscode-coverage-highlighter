import { Flux } from '../src/flux/flux';
import { AppAction, ICoverageFile, ICoverageStat } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore } from './common';
import { StatusBarManager } from '../src/statusBarManager';


class StatusBarItemMock {
    public text: string;
    public tooltip: string | undefined;
    public color: string | undefined;
    public command: string | undefined;

    public _show: boolean = false;

    public show() {
        this._show = true;
    }

    public hide() {
        this._show = false;
    }

    public dispose() {
        // noop
    }
}

let component: StatusBarManager;
let barMock: StatusBarItemMock; // Spy<vscode.StatusBarItem>;

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

suite('StatusBar Tests', () => {
    setup(async () => {
        await getTestStore();

        barMock = new StatusBarItemMock();

        // Setup StatusBar
        component = new StatusBarManager(barMock);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        component.dispose();
    });

    test('Ensure that bar has been created', () => {
        assert.ok(barMock.text);
        assert.ok(!barMock._show);
    });

    test('Show "loading" when tasks are running', async () => {
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash: 'workId#1'});
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash: 'workId#2'});
        assert.equal(barMock._show, true);
        assert.equal(barMock.text, '$(repo-sync)');

        Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash: 'workId#1'});
        assert.equal(barMock._show, true);

        Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash: 'workId#2'});
        assert.equal(barMock._show, false);
    });

    test('Show icon when coverage was discovered', async() => {
        addCoverageFile();
        assert.equal(barMock._show, true);
        assert.equal(barMock.text, '$(eye)');
    });

    test('Show coverage stat', async() => {
        addCoverageFile();
        addCoverageStat();

        assert.equal(barMock._show, true);
        assert.equal(barMock.text.indexOf('SOME_LABEL') !== -1, true);
        assert.equal(barMock.tooltip.indexOf('SOME_TOOLTIP') !== -1, true);
    });

    test('Toggle coverage: display off', async() => {
        addCoverageFile();
        addCoverageStat();
        assert.notStrictEqual(barMock.command, undefined);

        await vscode.commands.executeCommand(barMock.command);
        await sleep();
        assert.equal(barMock._show, true);  // Still true
        assert.equal(barMock.text.indexOf('$(eye-closed)') !== -1, true);
    });
});
