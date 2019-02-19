import { Flux } from './flux';
import { IConfig, AppAction, IProvider, CoverageColor, ICoverage, ICoverageFragment } from './types';
import { TextEditor, window, Range, ThemeColor, DecorationRangeBehavior, OverviewRulerLane, TextEditorDecorationType} from 'vscode';
import { App } from './app';


export class HighlightProvider extends App implements IProvider {
    /**
     * Provider for each editor
     *
     * Listen: UPDATE_CONFIG, SET_FILES_MAP, TOGGLE_COVERAGE_DISPLAYING
     * Dispatch: none
     */

    private config: IConfig;
    private currentState: boolean = false;
    private coverage: ICoverage|undefined;

    private _currentRed: TextEditorDecorationType|undefined|null;
    private _currentGreen: TextEditorDecorationType|undefined|null;
    private _overviewRulerColor: ThemeColor|undefined;

    constructor(private editor: TextEditor) {
        super();
        this.config = Flux.getState('config');
        Flux.on(AppAction.UPDATE_CONFIG, this.onConfigChange, this, this.disposables);
        Flux.on(AppAction.SET_FILES_MAP, this.onMapChange, this, this.disposables);
        Flux.on(AppAction.TOGGLE_COVERAGE_DISPLAYING, this.redraw, this, this.disposables);
    }

    public init() {
        this.onMapChange();
    }

    public activate() {
        this.onMapChange();
    }

    public dispose() {
        // this._removeDecorations();
        this._disposeColors();
        Flux.dispatch({type: AppAction.UPDATE_COVERAGE_STAT, stat: undefined});
        super.dispose();
    }

    private get overviewRulerColor() {
        if (this._overviewRulerColor === undefined) {
            this._overviewRulerColor = new ThemeColor('editorOverviewRuler.errorForeground');
        }
        return this._overviewRulerColor;
    }

    private get currentRed() {
        if (this._currentRed !== undefined) {
            return this._currentRed;
        }
        this._currentRed = null;
        if (this.config.redBgColor) {
            this._currentRed = window.createTextEditorDecorationType({
                isWholeLine: this.config.isWholeLine && !this.coverage.parserInfo.hasAdditionalColor,
                rangeBehavior: DecorationRangeBehavior.ClosedClosed, //ClosedOpen,
                outline: 'none',
                backgroundColor: this.config.redBgColor,
                overviewRulerColor: this.overviewRulerColor,
                overviewRulerLane: OverviewRulerLane.Center
            });
        }
        return this._currentRed;
    }

    private get currentGreen() {
        if (this._currentGreen !== undefined) {
            return this._currentGreen;
        }
        this._currentGreen = null;
        if (this.config.greenBgColor) {
            this._currentGreen = window.createTextEditorDecorationType({
                isWholeLine: this.config.isWholeLine,
                rangeBehavior: DecorationRangeBehavior.ClosedClosed, //ClosedOpen,
                outline: 'none',
                backgroundColor: this.config.greenBgColor
            });
        }
        return this._currentGreen;
    }

    private _disposeColors() {
        for (const color of [this._currentRed, this._currentGreen]) {
            if (color) {
                color.dispose();
            }
        }
        this._currentRed = this._currentGreen = undefined;
    }

    private redraw() {
        const displayCoverage = Flux.getState('displayCoverage') as boolean;

        if (!displayCoverage) {
            this._removeDecorations();
            return;
        }

        // Get info from coverage storage
        if (!this.coverage) {
            this._removeDecorations();
            return;
        }

        this._addDecorations();
    }

    private onConfigChange() {
        this._removeDecorations();
        this.config = Flux.getState('config');
        this.redraw();
    }

    private onMapChange() {
        const document = this.editor.document;
        if (document.isDirty) {
            return;
        }

        this._removeDecorations();  // KEEP????

        const fileId = document.uri.fsPath.toLocaleLowerCase();
        this.coverage = Flux.getState('coverage')[fileId];

        Flux.dispatch({type: AppAction.UPDATE_COVERAGE_STAT, stat: this.coverage ? this.coverage.stat : undefined});
        this.redraw();
    }

    private _addDecorations() {
        if (this.currentState === true) {
            return;
        }

        if (!this.coverage) {
            return;
        }
        const redRanges = this.makeRange(CoverageColor.RED);
        const greenRanges = this.makeRange(this.config.isWholeLine && this.coverage.parserInfo.hasAdditionalColor ?
            CoverageColor.GREEN_BG : CoverageColor.GREEN);

        if (redRanges !== undefined && this.currentRed) {
            this.editor.setDecorations(this.currentRed, redRanges);
            this.currentState = true;
        }
        if (greenRanges !== undefined && this.currentGreen) {
            this.editor.setDecorations(this.currentGreen, greenRanges);
            this.currentState = true;
        }
    }

    private _removeDecorations() {
        if (this.currentState === false) {
            return;
        }

        if (this.currentRed) {
            this.editor.setDecorations(this.currentRed, []);
        }
        if (this.currentGreen) {
            this.editor.setDecorations(this.currentGreen, []);
        }

        this._disposeColors();
        this.currentState = false;
    }

    private makeRange(color: CoverageColor): Range[] {
        return this.coverage.fragments
            .filter((b: ICoverageFragment) => b.color === color)
            .map((b: ICoverageFragment) => new Range(
                b.start.line, b.start.column || 0,
                b.end.line, b.end.column || Number.MAX_VALUE));
    }
}
