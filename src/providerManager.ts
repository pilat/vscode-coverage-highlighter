import { App } from './app';
import { window, TextEditor } from 'vscode';
import { TProvider, IProvider } from './types';


export class ProviderManager extends App {
    /**
     * This manager creates and removes highlightProvider for each VISIBLE editor and
     * calls "activate" method directly when editor will be activated.
     *
     * Listen: none
     * Dispatch: none
     */

    private attached: Map<string, IProvider> = new Map();  // editor id -> provider instance

    constructor(private provider: TProvider) {
        super();
        window.onDidChangeVisibleTextEditors(this.onChangeEditors, this, this.disposables);
        window.onDidChangeActiveTextEditor(this.onChangeActive, this, this.disposables);
        this.onChangeEditors(window.visibleTextEditors);
        this.onChangeActive(window.activeTextEditor);
    }

    public dispose() {
        for (const [, provider] of Array.from(this.attached)) {
            provider.dispose();
        }

        super.dispose();
    }

    private onChangeEditors(editors: TextEditor[]) {
        // Add new
        for (const editor of editors) {
            const id = editor.document.uri.toString();
            if (!this.attached.has(id)) {
                const provider = new this.provider(editor);
                this.attached.set(id, provider);
                provider.activate();
            }
        }

        // Remove not mentioned
        const mentionedIds: string[] = editors.map(o => o.document.uri.toString());
        for (const [id, provider] of Array.from(this.attached)) {
            if (mentionedIds.indexOf(id) === -1) {
                provider.dispose();
                this.attached.delete(id);
            }
        }
    }

    private onChangeActive(editor: TextEditor) {
        if (!editor) {
            return;
        }
        const uri = editor.document.uri.toString();
        for (const [id, provider] of Array.from(this.attached)) {
            if (id === uri) {
                provider.activate();
            }
        }
    }
}
