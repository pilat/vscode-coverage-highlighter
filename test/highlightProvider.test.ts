import { Flux } from '../src/flux/flux';
import { CoverageParser } from './../src/coverageParser';
import { HighlightProvider } from './../src/highlightProvider';
import { AppAction, IWatcher } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore, openFile, COVERAGE_FILE, closeAllEditors } from './common';
import {mock, restore, Spy} from 'simple-mock';

class TextEditorMock {
    constructor(private realEditor: vscode.TextEditor) { }

    public get document() {
        return this.realEditor.document;
    }

    public setDecorations(_color: any, ranges: any[]): Spy {
        if (ranges.length === 0) {
            return 'removed';
        } else {
            return 'added';
        }
    }

    public dispose() {
        // noop
    }
}

// export const workspace = new Workspace();


let store;
let component;
let editorMock: TextEditorMock;
const baseConfig = {defaultState: true, greenBgColor: '#00ff00', redBgColor: '#FF0000', isWholeLine: true};
let coverageParser;

async function addCoverage() {
    Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
    await sleep(200);
}


suite('HighlightProvider Tests', () => {
    setup(async () => {
        // Open real covered file
        await openFile('src/file1.ts');

        // Create editor mock based on original document
        editorMock = new TextEditorMock(vscode.window.activeTextEditor); // TODO: only document
        mock(editorMock, 'setDecorations');

        store = await getTestStore();
        coverageParser = new CoverageParser();
        Flux.dispatch({type: AppAction.SET_CONFIG, config: baseConfig});

        component = new HighlightProvider(editorMock);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        await closeAllEditors();
        restore();
        coverageParser.dispose();
        component.dispose();
    });

    test('No coverage file, no decorations', async () => {
        assert.ok(editorMock.setDecorations.called === false);
    });

    // Stat without decoration

    test('Add coverage -> show decorations', async () => {
        await addCoverage();
        assert.ok(editorMock.setDecorations.callCount === 2);
        assert.ok(editorMock.setDecorations.lastCall.returned === 'added');
    });

    test('Remove coverage -> remove decorations', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.REMOVE_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
        await sleep(200);
        assert.ok(editorMock.setDecorations.called);
        assert.ok(editorMock.setDecorations.lastCall.returned === 'removed');
    });

    test('Config was changed, one of colors was changed, all decorators will be replaced', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.UPDATE_CONFIG, config: {...baseConfig, redBgColor: '#ddeedd'}});
        await sleep(200);
        assert.ok(editorMock.setDecorations.callCount === 6);
        assert.deepEqual(
            editorMock.setDecorations.calls.map((o) => o.returned),
            ['added', 'added', 'removed', 'removed', 'added', 'added']);
    });

    test('Toggle decoration', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.TOGGLE_COVERAGE_DISPLAYING});
        await sleep(100);
        assert.ok(editorMock.setDecorations.callCount === 4);
        assert.ok(editorMock.setDecorations.lastCall.returned === 'removed');
    });
});
