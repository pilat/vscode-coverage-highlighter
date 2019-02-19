import { Flux } from './flux';
import { App } from './app';
import { CoverageFile } from './coverageFile';
import { CancellationTokenSource } from 'vscode';
import { ICoverageReport, AppAction, CoverageFileActionTypes, ICoverage, ICoverageMap } from './types';
import { randomId } from './helpers/utils';


export class CoverageParser extends App {
    /**
     * Coverage watcher discovers coverage files and parses them.
     * After parsing it saves coverage results there and put actual information into store
     *
     * Listen: ADD_COVERAGE_FILE, REMOVE_COVERAGE_FILE
     * Dispatch: ADD_TASK_ID, REMOVE_TASK_ID, SET_FILES_MAP
     */

    private cancellationTokens: Map<string, CancellationTokenSource> = new Map();
    // private reverseMap: Map<string, string[]> = new Map();
    private localstore: Map<string, ICoverageReport> = new Map();

    public constructor() {
        super();
        Flux.on(AppAction.ADD_COVERAGE_FILE, this.onAddFile, this, this.disposables);
        Flux.on(AppAction.REMOVE_COVERAGE_FILE, this.onRemoveFile, this, this.disposables);
    }

    private onAddFile(action: CoverageFileActionTypes) {
        const { coverageFile } = action;

        const token: CancellationTokenSource = new CancellationTokenSource();
        this.cancellationTokens.set(coverageFile.uri, token);

        const randomHash = randomId();
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash});

        const file = new CoverageFile(coverageFile, token.token);
        file
            .parse()
            .then(() => {
                Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash});
                if (!this.cancellationTokens.has(coverageFile.uri)) {
                    return;
                } else {
                    this.cancellationTokens.delete(coverageFile.uri);
                }

                if (!file.hasError) {
                    this.localstore.set(coverageFile.uri.toLowerCase(), file.report);
                    this._updateStore();
                }
            });
    }

    private onRemoveFile(action: CoverageFileActionTypes) {
        const { coverageFile } = action;

        const token: CancellationTokenSource|undefined = this.cancellationTokens.get(coverageFile.uri);
        if (token) {
            token.cancel();
            this.cancellationTokens.delete(coverageFile.uri);
        }

        const filename = coverageFile.uri.toLowerCase();
        if (this.localstore.has(filename)) {
            this.localstore.delete(filename);
            this._updateStore();
        }
    }

    private _updateStore() {
        const randomHash = randomId();
        Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash});

        let newMap: Map<string, ICoverage> = new Map();
        // Put to the store files from all coverage sources and with best parser priority
        for (const [, report] of this.localstore) {
            for (const coverage of report) {
                const fileId = coverage.file.toLocaleLowerCase();

                if (newMap.has(fileId)) {
                    const prevValue = newMap.get(fileId)
                    if (prevValue.parserInfo.priority > coverage.parserInfo.priority) {
                        // TODO: What about parser name comparing?..
                        continue;
                    } else {
                        newMap.delete(fileId)
                    }
                }
                newMap.set(fileId, coverage)
            }
        }

        let newMapObj: ICoverageMap = {};
        for (let [k, v] of newMap) {
            newMapObj[k] = v;
        }

        Flux.dispatch({type: AppAction.SET_FILES_MAP, map: newMapObj});
        Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash});
    }
}
