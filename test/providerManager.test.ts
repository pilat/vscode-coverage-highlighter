import { Flux } from '../src/flux/flux';
import { ProviderManager } from './../src/providerManager';
import { AppAction, IProvider } from './../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { sleep, closeAllEditors, newFile, openFile } from './common';
import {mock, restore} from 'simple-mock';


class FakeProvider implements IProvider {
    public _activated: boolean = false;

    constructor(_editor: vscode.TextEditor) {
        providers.add(this);
    }

    public activate() {
        this._activated = true;
    }

    public dispose() {
        providers.delete(this);
    }
}

const providers: Set<IProvider> = new Set();
let manager: ProviderManager;

suite('ProviderManager Tests', () => {
    setup(async () => {
        // Setup ProviderManager
        manager = new ProviderManager(FakeProvider);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        await closeAllEditors();
        manager.dispose();
        providers.clear();
    });

    test('No editors => no providers', () => {
        assert.equal(providers.size, 0);
    });

    test('One provider for one open file', async () => {
        await newFile();
        assert.equal(providers.size, 1);
    });

    test('One active provider (visible), but two files were opened', async() => {
        await openFile('src/file1.ts');
        await openFile('src/file2.ts');
        assert.equal(providers.size, 1);
    });

    test('Two providers for splitted editor', async() => {
        await newFile();
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        assert.equal(providers.size, 2);
    });

    test('Ensure that activate() will be send when switched btw splits', async() => {
        await newFile();
        await vscode.commands.executeCommand('workbench.action.splitEditor');
        assert.equal(providers.size, 2);

        const _providers = Array.from(providers);
        _providers[0]._activated = _providers[1]._activated = false;
        await vscode.commands.executeCommand('workbench.action.navigateLeft');
        await sleep();
        assert.equal(_providers[0]._activated, true);
        assert.equal(_providers[1]._activated, false);

        await vscode.commands.executeCommand('workbench.action.navigateRight');
        await sleep();
        assert.equal(_providers[0]._activated, true);
        assert.equal(_providers[1]._activated, true);
    });

    test('Check dispose', async() => {
        await newFile();
        assert.equal(providers.size, 1);

        const disposeMock = mock(Array.from(providers)[0], 'dispose', () => {
            // noop
        });
        manager.dispose();
        assert.equal(disposeMock.callCount, 1);
        restore();
    });
});
