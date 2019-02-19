import { Flux } from '../src/flux/flux';
import { AppAction, ICoverageFile } from './../src/types';
import * as assert from 'assert';
import { sleep, getTestStore, COVERAGE_FILE, StoreKeepeer } from './common';
import { CoverageParser } from '../src/coverageParser';


suite('CoverageParser Tests', () => {
    let store: StoreKeepeer;
    let component: CoverageParser;

    setup(async () => {
        store = await getTestStore();

        component = new CoverageParser();
        Flux.dispatch({type: AppAction.APP_INIT});
        await sleep();
    });

    teardown(async () => {
        component.dispose();
    });

    test('Add bad file and ensure that map will never dispatchd', async () => {
        const coverageFile: ICoverageFile = {
            uri: 'fsPath',
            folder: 'folder'
        };
        Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile});
        await sleep(100);
        assert.notEqual(store.lastActionType, 'ADD_FILES_MAP');
        assert.notEqual(store.lastActionType, 'REDUCE_FILES_MAP');
        assert.ok(store.hasAction('ADD_TASK_ID') && store.hasAction('REMOVE_TASK_ID'));

    });

    test('Add valid file and wait mapping', async () => {
        Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
        await sleep(100);
        assert.ok(store.lastActionType === 'ADD_FILES_MAP');
        assert.ok(Object.keys(store.state.coverage).length > 0);
    });

    for (const withDelay of [true, false]) {
        test('Add and remove' + (withDelay ? '' : ' quickly') , async () => {
            Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
            if (withDelay) {
                sleep(100);
            }
            Flux.dispatch({type: AppAction.REMOVE_COVERAGE_FILE, coverageFile: COVERAGE_FILE});
            await sleep();
            assert.ok(store.hasAction('REDUCE_FILES_MAP'));
            assert.ok(Object.keys(store.state.coverage).length === 0);
        });
    }
});
