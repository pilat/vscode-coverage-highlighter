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

    private isValidColor(value: string) {
        return value.indexOf('rgba') === 0 || value.indexOf('#') === 0;
    }

    private isColorDisabled(value: string) {
        return value === '';
    }

    private getConfiguration() {
        const {
            wholeLine,
            files,
            defaultState,
            coveredColor,
            unCoveredColor
        } = workspace.getConfiguration(this.configId);

        this.config = {
            // Envisage string instead files array...
            files: typeof files === 'string' ? [files] : files,
            isWholeLine: !!wholeLine,
            defaultState: defaultState === 'enable' || defaultState === 1 || defaultState === true,
            greenBgColor: undefined, // disabled
            redBgColor: undefined // disabled
            // greenBgColor:  ? coveredColor : undefined,
            // redBgColor: unCoveredColor.indexOf('rgba') !== -1 || unCoveredColor.indexOf('#') === 0 ? unCoveredColor : undefined
        };
        
        if (!this.isColorDisabled(coveredColor)) {
            this.config.greenBgColor = 'rgba(20, 250, 20, 0.1)'
        }
        if (!this.isColorDisabled(unCoveredColor)) {
            this.config.redBgColor = 'rgba(255, 20, 20, 0.4)'
        }

        if (this.isValidColor(coveredColor)) {
            this.config.greenBgColor = coveredColor
        }
        if (this.isValidColor(unCoveredColor)) {
            this.config.redBgColor = unCoveredColor
        }
    }
}
