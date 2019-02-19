import { Flux } from '../src/flux/flux';
import { AppAction } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, getTestStore, FILES_DIR, EXAMPLE_WORKSPACE, StoreKeepeer } from './common';
import { join } from 'path';
import fs from 'fs';
import {mock, restore} from 'simple-mock';
import { CoverageWatcher } from '../src/coverageWatcher';
import { FileSystemWatcherStub } from './stubs/fsWatcher.stub';


suite('CoverageWatcher Tests', () => {
    const DEBOUNCE_DELAY = 10;
    const projectFolder = { uri: vscode.Uri.file(EXAMPLE_WORKSPACE) };
    const observableFile = vscode.Uri.file(join(projectFolder.uri.fsPath, 'observable.xml'));

    let store: StoreKeepeer;
    let component: CoverageWatcher;
    let mockedMethod: any;
    let fsWatcher: FileSystemWatcherStub;

    async function init() {
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep(300);
    }    

    setup(async () => {
        store = await getTestStore();

        // fileSystemWatcher doesn't work outside workspace, so..
        mockedMethod = mock(vscode.workspace, 'createFileSystemWatcher').callFn((..._) => {
            fsWatcher = new FileSystemWatcherStub();
            return fsWatcher;
        });

        Flux.dispatch({type: AppAction.SET_CONFIG, config: {files: ['observabl*.xml']}});
        component = new CoverageWatcher(projectFolder as vscode.WorkspaceFolder, DEBOUNCE_DELAY / 2);
    });

    teardown(async () => {
        component.dispose();
        restore();
        try{
            fs.unlinkSync(observableFile.fsPath);
        }catch (e) {
            // noop
        }
    });

    test('Project folder has no coverage file', async () => {
        await init();
        assert.ok(!store.hasAction('ADD_COVERAGE_FILE'));
    });

    test('Coverage file already exists. Watcher must discover it', async () => {
        fs.copyFileSync(join(FILES_DIR, 'cov.xml'), observableFile.fsPath);
        await init();
        await sleep(DEBOUNCE_DELAY + 300);
        assert.ok(store.hasAction('ADD_COVERAGE_FILE'));
    });

    test('Coverage file will be created', async () => {
        await init();
        fsWatcher._emitCreate(observableFile);
        await sleep(DEBOUNCE_DELAY);
        assert.ok(store.lastActionType === 'ADD_COVERAGE_FILE');
    });

    test('Coverage file will be changed (but has no added)', async () => {
        await init();
        fsWatcher._emitChange(observableFile);
        await sleep(DEBOUNCE_DELAY);
        // assert.ok(store.hasAction('REMOVE_COVERAGE_FILE'))
        assert.ok(store.lastActionType === 'ADD_COVERAGE_FILE');
    });

    test('Coverage file will be really changed', async () => {
        fs.copyFileSync(join(FILES_DIR, 'cov.xml'), observableFile.fsPath);
        await init();
        fsWatcher._emitChange(observableFile);
        await sleep(DEBOUNCE_DELAY);
        assert.ok(store.hasAction('REMOVE_COVERAGE_FILE'));
        assert.ok(store.lastActionType === 'ADD_COVERAGE_FILE');
    });

    test('Coverage file will be deleted', async () => {
        await init();
        fsWatcher._emitDelete(observableFile);
        await sleep(DEBOUNCE_DELAY);
        assert.ok(store.hasAction('REMOVE_COVERAGE_FILE'));
    });

    test('Restart search and reinstall when config will be modified', async () => {
        await init();
        assert.ok(mockedMethod.callCount === 1);

        Flux.dispatch({type: AppAction.UPDATE_CONFIG, config: {files: ['a.b.c', 'observabl*.xml']}});
        await sleep(100);

        assert.ok(mockedMethod.callCount === 3);  // previous one + 2 for each file pattern
    });
});
