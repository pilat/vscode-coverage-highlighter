import { Flux } from '../../src/flux/flux';
import { AppAction } from '../../src/types';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigServer } from '../../src/configServer';
import { sleep, getTestStore, StoreKeepeer } from './common';
import { randomId } from '../../src/helpers/utils';


suite('Config Tests', () => {
    let store: StoreKeepeer;
    let component: ConfigServer;

    setup(async () => {
        store = await getTestStore();

        // Setup ConfigServer
        component = new ConfigServer('vscode-coverage-highlighter');
        await sleep();
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        // await vscode.commands.executeCommand('workbench.action.closeAllEditors')
        component.dispose();
    });

    test('test config obtain', async () => {
        assert.notEqual(Flux.getState('config'), undefined);
        assert.equal(store.getHistoryAction(1), 'SET_CONFIG');
        assert.equal(Flux.getState('config.redBgColor'), 'rgba(255, 20, 20, 0.4)');
    });
    test('test config has changed on-fly', async () => {
        const c = vscode.workspace.getConfiguration('vscode-coverage-highlighter');
        const newValue = `rgba(${randomId()})`;
        await c.update('coveredColor', newValue, true);
        await sleep();
        assert.equal(store.lastActionType, 'UPDATE_CONFIG');
        const readedValue = Flux.getState('config.greenBgColor');
        assert.equal(readedValue, newValue);
        await c.update('coveredColor', undefined, true);  // restore
    });
    test('Test files are string', async () => {
        const c = vscode.workspace.getConfiguration('vscode-coverage-highlighter');
        await c.update('files', 'one_file.special', true);
        await sleep();
        const readedValue = Flux.getState('config.files');
        assert.deepEqual(readedValue, ['one_file.special']);
        await c.update('files', undefined, true);  // restore
    });

    for (const val of ['enable', 1, true]) {
        test(`Default state is enable with ${val}`, async () => {
            const c = vscode.workspace.getConfiguration('vscode-coverage-highlighter');
            await c.update('defaultState', val, true);
            await sleep();
            const readedValue = Flux.getState('config.defaultState');
            assert.equal(readedValue, true);
            await c.update('defaultState', undefined, true);  // restore
        });
    }

    for (const [optName, confName] of
        [['coveredColor', 'greenBgColor'], ['unCoveredColor', 'redBgColor']]) {
        test(`Test disabled ${optName} color`, async () => {
            const c = vscode.workspace.getConfiguration('vscode-coverage-highlighter');
            await c.update(optName, '', true);
            await sleep();
            const readedValue = Flux.getState(`config.${confName}`);
            assert.equal(readedValue, undefined);
            await c.update(optName, undefined, true);  // restore
        });
    }

    test('Config with bad color value', async () => {
        const c = vscode.workspace.getConfiguration('vscode-coverage-highlighter');
        await c.update('unCoveredColor', 'invalid_color', true);
        await sleep();
        const readedValue = Flux.getState(`config.redBgColor`);
        assert.equal(readedValue, 'rgba(255, 20, 20, 0.4)');
        await c.update('unCoveredColor', undefined, true);  // restore
    });
});
