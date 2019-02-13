import { App } from './app';
import { Flux } from './flux';
import { IConfig, AppAction } from './types';
import { workspace } from 'vscode';


export class ConfigServer extends App {
    /**
     * Send initial configuration.
     * Dispatch new configuration when configuration will be updated on-fly.
     *
     * Listen: APP_INIT
     * Dispatch: SET_CONFIG, UPDATE_CONFIG
     */
    private config: IConfig;

    constructor(private configId: string) {
        super();
        this.getConfiguration();
        Flux.dispatch({type: AppAction.SET_CONFIG, config: this.config});
    }

    public init() {
        workspace.onDidChangeConfiguration(this.onChange, this, this.disposables);
    }

    private onChange() {
        this.getConfiguration();
        Flux.dispatch({type: AppAction.UPDATE_CONFIG, config: this.config});
    }

    private getConfiguration() {
        const {
            wholeLine,
            files,
            defaultState,
            colors
        } = workspace.getConfiguration(this.configId);
        let {green, red} = colors;
        green = green || '#00ff00';
        red = red || '#ff0000';

        this.config = {
            // Envisage string instead files array...
            files: typeof files === 'string' ? [files] : files,
            isWholeLine: !!wholeLine,
            defaultState: defaultState === 'enable' || defaultState === 1 || defaultState === true,
            greenBgColor: green.indexOf('rgba') !== -1 || green.indexOf('#') === 0 ? green : undefined,
            redBgColor: red.indexOf('rgba') !== -1 || red.indexOf('#') === 0 ? red : undefined
        };
    }
}
