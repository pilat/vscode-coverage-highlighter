import { DiagnosticServer } from './diagnosticServer';
import { AppAction, IExtensionApi } from './types';
import { AppStore } from './store';
import { CoverageParser } from './coverageParser';
import { ConfigServer } from './configServer';
import { join } from 'path';
import { ExtensionContext, window, StatusBarAlignment } from 'vscode';
import { TelemetryReporter } from './telemetry';
import { CoverageManager } from './coverageManager';
import { StatusBarManager } from './statusBarManager';
import {Flux} from './flux';
import { ProviderManager } from './providerManager';
import { HighlightProvider } from './highlightProvider';
import { CoverageWatcher } from './coverageWatcher';


export let reporter: TelemetryReporter;

export async function activate(context: ExtensionContext) {
    const packageInfo = require(join(context.extensionPath, 'package.json'));
    reporter = new TelemetryReporter(packageInfo.name, packageInfo.version);

    Flux.init({ store: new AppStore() });

    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    context.subscriptions.push(
        reporter,
        statusBarItem,
        new ConfigServer(packageInfo.name),  // vscode-coverage-highlighter
        new StatusBarManager(statusBarItem),
        new CoverageManager(CoverageWatcher),
        new CoverageParser(),
        new DiagnosticServer(),
        new ProviderManager(HighlightProvider)
    );
    Flux.dispatch({type: AppAction.APP_INIT});

    let isActive = true;
    const api: IExtensionApi = {
        dispose: () => {
            if (isActive) {
                context.subscriptions.forEach(
                    (d) => d.dispose());
                isActive = false;
            }
        }
    };
    return api;
}
