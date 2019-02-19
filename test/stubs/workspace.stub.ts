import * as vscode from 'vscode';


export class WorkspaceStub {
    public workspaceFolders: vscode.WorkspaceFolder[] | undefined;
    private listeners: any[] = [];

    constructor(folders: vscode.WorkspaceFolder[] | undefined) {
        this.workspaceFolders = folders;
    }

    public onDidChangeWorkspaceFolders(listener: any, t: any, _: any) {
        this.listeners.push(listener.bind(t));
    }

    public dispose() {
        // noop
    }

    public _openFolder(addedItem: any) {
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
