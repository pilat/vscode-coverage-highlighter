
import { Flux } from '../src/flux/flux';
import { AppAction, ICoverage, CoverageColor } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore } from './common';
import {mock, restore, Spy} from 'simple-mock';
import { DiagnosticServer } from '../src/diagnosticServer';
import { LanguagesStub } from './stubs/diagnosticCollection.stub';


suite('DiagnosticServer Tests', () => {
    async function addMap() {
        const fileCov: ICoverage = {
            file: 'some.file',
            parserInfo: {
                name: 'unknown',
                priority: 10,
                hasAdditionalColor: false
            },
            fragments: [
                {
                    start: {line: 1, column: 1},
                    end: {line: 2, column: 20},
                    color: CoverageColor.RED,
                    note: '~test uncovered~'
                },
                
                {
                    start: {line: 3, column: 1},
                    end: {line: 4, column: 20},
                    color: CoverageColor.GREEN,
                    note: '~test covered~'
                },

            ]
        }
        Flux.dispatch({type: AppAction.SET_FILES_MAP, map: {'some.file': fileCov}})
        await sleep();
    }
    
    async function resetMap() {
        Flux.dispatch({type: AppAction.SET_FILES_MAP, map: {}})
        await sleep();
    }

    async function enable() {
        Flux.dispatch({type: AppAction.UPDATE_CONFIG, config: {showDiagnostic: true}});
        await sleep();
    }

    let component: DiagnosticServer;
    let theMock: Spy<string>;
    let languagesStub: LanguagesStub;

    setup(async () => {
        // Open real covered file
        // await openFile('src/file1.ts');

        // Create editor mock based on original document
        languagesStub = new LanguagesStub();
        theMock = mock(languagesStub, 'createDiagnosticCollection');

        await getTestStore();
        // coverageParser = new CoverageParser();
        Flux.dispatch({type: AppAction.SET_CONFIG, config: {}});

        // @ts-ignore Stub
        component = new DiagnosticServer(languagesStub);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        restore();
        // coverageParser.dispose();
        component.dispose();
    });

    test('Ensure with disabled feature nothing will be added', async () => {
        Flux.dispatch({type: AppAction.SET_CONFIG, config: {}});
        assert.ok(!theMock.called)
    });

    test('Collection will be created when feature enabled', async () => {
        await enable();
        assert.ok(theMock.called)
    });

    test('Collection will be empty', async () => {
        await enable();
        assert.ok(languagesStub._collection._items.length === 0)
    });

    test('Collection will be have one item', async () => {
        await enable();
        await addMap();
        assert.ok(languagesStub._collection._items.length === 1)
        assert.ok(languagesStub._collection._items[0].ranges.length === 1)
    });

    test('Ensure that note will be shown', async () => {
        await enable();
        await addMap();
        const diag: vscode.Diagnostic = languagesStub._collection._items[0].ranges[0]
        
        assert.ok(diag.message.indexOf('~test uncovered~') !== -1)
    });

    test('Ensure that it will be warnign', async () => {
        await enable();
        await addMap();
        const diag: vscode.Diagnostic = languagesStub._collection._items[0].ranges[0]
        
        assert.ok(diag.severity === vscode.DiagnosticSeverity.Warning)
    })

    test('Collection will be erased', async () => {
        await enable();
        await addMap();
        await resetMap();
        assert.ok(languagesStub._collection._items.length === 0)
    });
});
