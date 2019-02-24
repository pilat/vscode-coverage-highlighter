import { Flux } from '../../src/flux/flux';
import { CoverageParser } from '../../src/coverageParser';
import { HighlightProvider } from '../../src/highlightProvider';
import { AppAction } from '../../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore, openFile, COVERAGE_FILE, closeAllEditors } from './common';
import {mock, restore, Spy} from 'simple-mock';
import { TextEditorStub } from './stubs/textEditor.stub';


suite('HighlightProvider Tests', () => {
    let component: HighlightProvider;
    let decorationMock: Spy<string>;
    const baseConfig = {defaultState: true, greenBgColor: '#00ff00', redBgColor: '#FF0000', isWholeLine: true};
    let coverageParser: CoverageParser;

    async function addCoverage() {
        Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
        await sleep(200);
    }

    setup(async () => {
        // Open real covered file
        await openFile('src/file1.ts');

        // Create editor mock based on original document
        const editor = new TextEditorStub(vscode.window.activeTextEditor); // TODO: only document
        decorationMock = mock(editor, 'setDecorations');

        await getTestStore();
        coverageParser = new CoverageParser();
        Flux.dispatch({type: AppAction.SET_CONFIG, config: baseConfig});

        // @ts-ignore Mock
        component = new HighlightProvider(editor);
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
        assert.ok(decorationMock.called === false);
    });

    // Stat without decoration

    test('Add coverage -> show decorations', async () => {
        await addCoverage();
        assert.ok(decorationMock.callCount === 2);
        assert.ok(decorationMock.lastCall.returned === 'added');
    });

    test('Remove coverage -> remove decorations', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.REMOVE_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
        await sleep(200);
        assert.ok(decorationMock.called);
        assert.ok(decorationMock.lastCall.returned === 'removed');
    });

    test('Config was changed, one of colors was changed, all decorators will be replaced', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.UPDATE_CONFIG, config: {...baseConfig, redBgColor: '#ddeedd'}});
        await sleep(200);
        assert.ok(decorationMock.callCount === 6);
        assert.deepEqual(
            decorationMock.calls.map((o) => o.returned),
            ['added', 'added', 'removed', 'removed', 'added', 'added']);
    });

    test('Toggle decoration', async () => {
        await addCoverage();
        Flux.dispatch({type: AppAction.TOGGLE_COVERAGE_DISPLAYING});
        await sleep(100);
        assert.ok(decorationMock.callCount === 4);
        assert.ok(decorationMock.lastCall.returned === 'removed');
    });
});
