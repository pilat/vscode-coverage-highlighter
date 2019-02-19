import { IWatcher } from './../../src/types';
import * as vscode from 'vscode';


export class WatcherStub implements IWatcher {
    public _activated: boolean = false;
    public static _watchers: Set<IWatcher> = new Set();

    constructor(_: vscode.WorkspaceFolder) {
        WatcherStub._watchers.add(this);
    }

    public dispose() {
        WatcherStub._watchers.delete(this);
    }
}
