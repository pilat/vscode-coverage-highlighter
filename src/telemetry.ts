import { default as _TelemetryReporter } from 'vscode-extension-telemetry';


const TELEMETRY_KEY = 'a1941800-1dde-44ec-84a9-7cd2a0b715f7';


export class TelemetryReporter extends _TelemetryReporter {
    constructor(name: string, version: string) {
        super(name, version, TELEMETRY_KEY);
    }
}
