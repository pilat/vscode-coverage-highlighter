import { Flux } from '../src/flux/flux';
import { AppAction, IWatcher } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep } from './common';
import { CoverageManager } from '../src/coverageManager';

class WorkspaceMock {
    public workspaceFolders: vscode.WorkspaceFolder[] | undefined;
    private listeners: any[] = [];

    constructor(folders: vscode.WorkspaceFolder[] | undefined) {
        this.workspaceFolders = folders;
    }

    public onDidChangeWorkspaceFolders(listener, t, disp) {
        this.listeners.push(listener.bind(t));
    }

    public dispose() {
        // noop
    }

    public _openFolder(addedItem) {
        if (this.workspaceFolders === undefined) {
            this.workspaceFolders = [];
        }
        this.workspaceFolders.push(addedItem);
        this.listeners.forEach((o) => o({added: [addedItem]}));
    }

    public _closeFolder(index: number) {
        const removedItem = this.workspaceFolders.find((o) => o.index === index);

        this.workspaceFolders = this.workspaceFolders.filter((o) => o.index !== index);
        this.listeners.forEach((o) => o({removed: [removedItem]}));
    }
}

// export const workspace = new Workspace();


class FakeWatcher implements IWatcher {
    public _activated: boolean = false;

    constructor(folder: vscode.WorkspaceFolder) {
        watchers.add(this);
    }

    public dispose() {
        watchers.delete(this);
    }
}

const watchers: Set<IWatcher> = new Set();
let manager;
let workspaceMock: WorkspaceMock;

async function createManager() {
    // Setup CoverageManager
    manager = new CoverageManager(FakeWatcher, workspaceMock);
    Flux.dispatch({type: AppAction.APP_INIT});
    await sleep();
}

suite('CoverageManager Tests', () => {
    setup(async () => {
    //     // Tests cannot open folders, so emulate vscode behaviour:
    //     // workspace.workspaceFolders contains already opened folders
    //     // onDidChangeWorkspaceFolders dispatch event with added/removed folders

        workspaceMock = new WorkspaceMock();
    });

    teardown(() => {
        if (manager) {
            manager.dispose();
        }
        watchers.clear();
    });

    test('No folders, no watchers', async () => {
        await createManager();
        assert.equal(watchers.size, 0);
    });

    test('One folder, one watcher', async () => {
        workspaceMock.workspaceFolders = [
            {uri: 'some', name: 'Project', index: 0} as vscode.WorkspaceFolder
        ];
        await createManager();
        assert.equal(watchers.size, 1);
    });

    test('Two folder, two watchers, but first will be closed', async () => {
        workspaceMock.workspaceFolders = [
            {uri: 'some', name: 'Project', index: 0} as vscode.WorkspaceFolder,
            {uri: 'anoter', name: 'Project 2', index: 1} as vscode.WorkspaceFolder
        ];
        await createManager();
        assert.equal(watchers.size, 2);

        workspaceMock._closeFolder(0);
        await sleep();
        assert.equal(watchers.size, 1);
    });

    test('No folders, folder will be opened', async () => {
        await createManager();
        assert.equal(watchers.size, 0);

        workspaceMock._openFolder({uri: 'some', name: 'Project', index: 0} as vscode.WorkspaceFolder);
        await sleep();
        assert.equal(watchers.size, 1);
    });
});
