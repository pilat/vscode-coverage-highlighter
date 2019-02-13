import { Flux } from './flux';
import { App } from './app';
import { CoverageFile } from './coverageFile';
import { CancellationTokenSource } from 'vscode';
import { ICoverageReport, AppAction, CoverageFileActionTypes, ICoverageMap, ICoverage } from './types';
import { randomId } from './helpers/utils';


export class CoverageParser extends App {
    /**
     * Coverage watcher discovers coverage files and this class parses them.
     * After parsing it saves coverage on store
     *
     * Listen: ADD_COVERAGE_FILE, REMOVE_COVERAGE_FILE
     * Dispatch: ADD_TASK_ID, REMOVE_TASK_ID, ADD_FILES_MAP, REDUCE_FILES_MAP
     */

    private cancellationTokens: Map<string, CancellationTokenSource> = new Map();
    private reverseMap: Map<string, string[]> = new Map();

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
                    const files = this.saveCoverage(file.report);
                    this.reverseMap.set(coverageFile.uri, files);
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

        // Cleanup coverage map...
        const files = (this.reverseMap.get(coverageFile.uri) || []);
        this.reverseMap.delete(coverageFile.uri);
        Flux.dispatch({type: AppAction.REDUCE_FILES_MAP, files});
    }

    private saveCoverage(report: ICoverageReport): string[] {
        const files = [];
        const map: ICoverageMap = {};
        for (const coverage of report) {
            const fileId = coverage.file.toLocaleLowerCase();
            const currentCoverage: ICoverage|undefined = Flux.getState('coverage')[fileId];
            if (currentCoverage && currentCoverage.priority >= coverage.priority) {
                // When storage has already contained coverage info for this file
                continue;
            }
            files.push(fileId);
            map[fileId] = coverage;
        }
        Flux.dispatch({type: AppAction.ADD_FILES_MAP, map});
        return files;
    }
}
