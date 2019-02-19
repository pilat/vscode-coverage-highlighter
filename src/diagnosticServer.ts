import { Flux } from './flux';
import { IConfig, AppAction, CoverageColor, ICoverageFragment, ICoverageMap, ICoverageFragmentBase } from './types';
import { Range, languages, DiagnosticCollection, Diagnostic, DiagnosticSeverity, Uri} from 'vscode';
import { App } from './app';


type TVSCodeLanguages = typeof languages;


export class DiagnosticServer extends App {
    /**
     * Listens coverage map and creates diagnostic collection
     *
     * Listen: UPDATE_CONFIG, SET_FILES_MAP
     * Dispatch: none
     */

    private _languages: TVSCodeLanguages;
    private config: IConfig;
    private _collection: DiagnosticCollection|undefined;

    constructor(overrideLanguages?: TVSCodeLanguages) {
        super();
        this._languages = overrideLanguages || languages;
        this.config = Flux.getState('config');
        Flux.on(AppAction.UPDATE_CONFIG, this.onConfigChange, this, this.disposables);
        Flux.on(AppAction.SET_FILES_MAP, this.onMapChange, this, this.disposables);
    }

    public init() {
        this.onMapChange();
    }

    public dispose() {
        this._disposeCollection();
        super.dispose();
    }

    private _disposeCollection() {
        if (this._collection !== undefined) {
            this._collection.clear()
            this._collection.dispose();
            this._collection = undefined;
        }
    }

    private onConfigChange() {
        this.config = Flux.getState('config');
        this.redraw();
    }

    private onMapChange() {
        this.redraw();
    }

    private redraw() {
        this._disposeCollection();
        if (!this.config.showDiagnostic) {
            return
        }

        this._collection = this._languages.createDiagnosticCollection('coverage')
        const coverageMap: ICoverageMap = Flux.getState('coverage');
        this._collection.clear();
        for (const coverage of Object.values(coverageMap)) {
            this._collection.set(Uri.file(coverage.file), this._createDiagnostic(coverage.fragments))
        }
    }

    private _createDiagnostic(fragments: ICoverageFragmentBase[]): Diagnostic[] {
        return fragments
            .filter((b: ICoverageFragment) => b.color === CoverageColor.RED)
            .map((b: ICoverageFragment) => {
                return new Diagnostic(
                    new Range(
                        b.start.line, b.start.column || 0,
                        b.end.line, b.end.column || Number.MAX_VALUE),
                    b.note ? `Not covered: ${b.note}` : 'Not covered',
                    DiagnosticSeverity.Warning
                )
            });
    }
}
