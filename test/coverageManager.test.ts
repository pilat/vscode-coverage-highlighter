import { Flux } from '../src/flux/flux';
import { AppAction } from './../src/types';
import * as assert from 'assert';
import { sleep } from './common';
import { CoverageManager } from '../src/coverageManager';
import { WorkspaceStub } from './stubs/workspace.stub';
import { WatcherStub } from './stubs/watcher.stub';


suite('CoverageManager Tests', () => {
    let manager: CoverageManager;
    let workspaceStub: WorkspaceStub;
    const watchers = WatcherStub._watchers

    async function createManager(folders?: any[]) {
        // Tests cannot open folders, so emulate vscode behaviour
        workspaceStub = new WorkspaceStub(folders);

        // @ts-ignore: Setup CoverageManager
        manager = new CoverageManager(WatcherStub, workspaceStub);
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    }

    setup(async () => {
        // noop
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
        const workspaceFolders = [
            {uri: 'some', name: 'Project', index: 0}
        ];
        await createManager(workspaceFolders);
        assert.equal(watchers.size, 1);
    });

    test('Two folder, two watchers, but first will be closed', async () => {
        const workspaceFolders = [
            {uri: 'some', name: 'Project', index: 0},
            {uri: 'anoter', name: 'Project 2', index: 1}
        ];
        await createManager(workspaceFolders);
        assert.equal(watchers.size, 2);

        workspaceStub._closeFolder(0);
        await sleep();
        assert.equal(watchers.size, 1);
    });

    test('No folders, folder will be opened', async () => {
        await createManager();
        assert.equal(watchers.size, 0);

        workspaceStub._openFolder({uri: 'some', name: 'Project', index: 0});
        await sleep();
        assert.equal(watchers.size, 1);
    });
});
