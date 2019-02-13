import { Flux } from './flux';
import { App } from './app';
import { IConfig, AppAction, ICoverageFile, IWatcher } from './types';
import { RelativePattern, workspace, Uri, WorkspaceFolder, CancellationTokenSource } from 'vscode';
import { findFiles, randomId } from './helpers/utils';
import { debounce } from 'debounce';


export class CoverageWatcher extends App implements IWatcher {
    /**
     * This watcher will be created for each project folder. It will look after project folder.
     * If coverage file will be added/removed or modified, it be able to notify coverageParser.
     * Also it listens configuration changes and reload watchers when needed.
     *
     * Listen: APP_INIT, UPDATE_CONFIG
     * Dispatch: ADD_TASK_ID, REMOVE_TASK_ID, ADD_COVERAGE_FILE, REMOVE_COVERAGE_FILE
     */

    private cancellationTokens: Set<CancellationTokenSource> = new Set();

    private config: IConfig;
    private candidates: Set<string> = new Set();
    private folderPath: string;
    private apply: any;

    constructor(folder: WorkspaceFolder, debounceDelay: number = 750) {
        super();
        this.folderPath = folder.uri.fsPath;
        this.config = Flux.getState('config');
        Flux.on(AppAction.UPDATE_CONFIG, this.onConfigChange, this, this.disposables);
        this.apply = debounce(this._apply.bind(this), debounceDelay);
    }

    public init() {
        this.setupWatchers();
    }

    public dispose() {
        this._dispose();
        super.dispose();
    }

    private onConfigChange() {
        this.config = Flux.getState('config');
        this._dispose();  // cancel existing watchers
        this.setupWatchers();
    }

    private setupWatchers() {
        for (const pattern of this.config.files) {
            // Setup watchers for each pattern
            const relativePattern = new RelativePattern(this.folderPath, pattern);
            const watcher = workspace.createFileSystemWatcher(relativePattern);
            this.disposables.push(watcher);

            // [watcher.onDidCreate, watcher.onDidChange, watcher.onDidDelete].forEach(
            //     (f) => f(this.onChange, this, this.disposables));
            this.disposables.push(
                watcher.onDidCreate(this.onChanges.bind(this)),
                watcher.onDidChange(this.onChanges.bind(this)),
                watcher.onDidDelete(this.onChanges.bind(this))
            );

            // Search files which already exist
            const token: CancellationTokenSource = new CancellationTokenSource();
            this.cancellationTokens.add(token);
            const randomHash = randomId();
            Flux.dispatch({type: AppAction.ADD_TASK_ID, randomHash});

            findFiles(relativePattern, token.token)
                .then((files) => {
                    for (const file of files) {
                        this.onChanges(file);
                    }
                })
                .catch(() => {
                    // :(
                })
                .finally(() => {
                    this.cancellationTokens.delete(token);
                    Flux.dispatch({type: AppAction.REMOVE_TASK_ID, randomHash});
                });
        }
    }

    private onChanges(file: Uri) {
        this.candidates.add(file.fsPath);

        // @ts-ignore
        this.apply();
    }

    private _apply() {
        // Remove each one and then add again
        for (const uri of this.candidates) {
            Flux.dispatch({type: AppAction.REMOVE_COVERAGE_FILE, coverageFile: this.makeCoverageFile(uri)});
        }

        for (const uri of this.candidates) {
            Flux.dispatch({type: AppAction.ADD_COVERAGE_FILE, coverageFile: this.makeCoverageFile(uri)});
        }
        this.candidates.clear();
    }

    private makeCoverageFile(uri: string): ICoverageFile {
        return {uri, folder: this.folderPath};
    }

    private _dispose() {
        for (const uri of this.candidates) {
            // this.onDelete(uri);
            Flux.dispatch({type: AppAction.REMOVE_COVERAGE_FILE, coverageFile: this.makeCoverageFile(uri)});
        }

        this.cancellationTokens.forEach(
            (token) => token.cancel());
        this.cancellationTokens.clear();
    }
}
