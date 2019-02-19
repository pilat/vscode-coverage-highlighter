import * as vscode from 'vscode';


export class TextEditorStub {
    constructor(private realEditor: vscode.TextEditor) { }

    public get document() {
        return this.realEditor.document;
    }

    public setDecorations(_color: any, ranges: any[]): string {
        if (ranges.length === 0) {
            return 'removed';
        } else {
            return 'added';
        }
    }

    public dispose() {
        // noop
    }
}
