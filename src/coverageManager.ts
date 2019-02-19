import { App } from './app';
import { workspace, WorkspaceFoldersChangeEvent } from 'vscode';
import { TWatcher, IWatcher } from './types';


type TVSCodeWorkspace = typeof workspace;

export class CoverageManager extends App {
    /**
     * Monitor project's folders and creates/removes CoverageWatcher for each folder.
     *
     * Listen: none
     * Dispatch: none
     */

    private watchers: Map<string, IWatcher> = new Map();
    private _workspace: TVSCodeWorkspace;

    constructor(private watcher: TWatcher, workspaceOverride?: TVSCodeWorkspace) {
        super();
        this._workspace = workspaceOverride || workspace;
        this.getFolders();
        this._workspace.onDidChangeWorkspaceFolders(this.onChange, this, this.disposables);
    }

    public dispose() {
        for (const [, watcher] of Array.from(this.watchers)) {
            watcher.dispose();
        }
        this.watchers.clear();
        super.dispose();
    }

    private onChange(e: WorkspaceFoldersChangeEvent) {
        for (const folder of e.removed || []) {
            // Remove watcher
            const watcher = this.watchers.get(folder.uri.fsPath);
            if (watcher) {
                watcher.dispose();
                this.watchers.delete(folder.uri.fsPath);
            }
        }
        for (const folder of e.added || []) {
            // Add watcher
            const watcher = new this.watcher(folder);
            this.watchers.set(folder.uri.fsPath, watcher);
        }
    }

    private getFolders() {
        for (const folder of this._workspace.workspaceFolders || []) {
            this.onChange({added: [folder], removed: []});  // emulate
        }
    }
}
