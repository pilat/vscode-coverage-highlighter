import { Flux } from './flux/flux';
import { Disposable } from 'vscode';
import { AppAction } from './types';


export class App implements Disposable {
    protected disposables: Disposable[] = [];

    constructor() {
        Flux.on(AppAction.APP_INIT, this.init, this, this.disposables);
    }

    public init() {
        // Hasn't implemented yet
    }

    public dispose() {
        this.disposables.forEach(
            (disposable) => disposable.dispose());
    }
}
