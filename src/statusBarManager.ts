import { Flux } from './flux';
import { StatusBarItem, commands } from 'vscode';
import { AppAction, ICoverageFile, ITask, ICoverageStat } from './types';
import { App } from './app';


export class StatusBarManager extends App {
    /**
     * Listen and show icon on statusBar. Also could call command when user click on icon.
     *
     * Listen: APP_INIT, ADD_TASK_ID, REMOVE_TASK_ID, ADD_COVERAGE_FILE, UPDATE_COVERAGE_STAT, TOGGLE_COVERAGE_DISPLAYING
     * Dispatch: TOGGLE_COVERAGE_DISPLAYING
     */

    constructor(private statusBar: StatusBarItem) {
        super();
        this.statusBar.command = 'vscode-coverage-highlighter.toggle';
        this.statusBar.text = '$(repo-sync)';
        this.statusBar.tooltip = 'Loading...';

        Flux.on(AppAction.ADD_TASK_ID, this.redraw, this, this.disposables);
        Flux.on(AppAction.REMOVE_TASK_ID, this.redraw, this, this.disposables);
        Flux.on(AppAction.ADD_COVERAGE_FILE, this.redraw, this, this.disposables);
        Flux.on(AppAction.UPDATE_COVERAGE_STAT, this.redraw, this, this.disposables);
        Flux.on(AppAction.TOGGLE_COVERAGE_DISPLAYING, this.redraw, this, this.disposables);
    }

    public init() {
        const newCommand = commands.registerCommand(this.statusBar.command, () => {
            Flux.dispatch({type: AppAction.TOGGLE_COVERAGE_DISPLAYING});
        });
        this.disposables.push(newCommand);
        this.redraw();
    }

    private redraw() {
        const tasks = Flux.getState('tasks') as ITask[];
        if (tasks.length > 0) {
            this.statusBar.show();
            this.statusBar.text = '$(repo-sync)';
            this.statusBar.tooltip = 'Loading...';
            return;
        }

        const coverageFiles = Flux.getState('files') as ICoverageFile[];
        if (coverageFiles.length === 0) {
            // No one coverage file was discovered. So, plugin will be hidden
            this.statusBar.hide();
            return;
        } else {
            this.statusBar.show();
        }
        const stat: ICoverageStat|undefined = Flux.getState('coverageStat');
        const msg: string = stat ? ` ${stat.label}` : '';
        const tooltip: string = stat && stat.tooltip ? `${stat.tooltip}\n` : '';

        // if (stat) {
        //     const coverage = Math.ceil(stat.coveredLines * 100 / stat.totalLines);
        //     msg = ` ${coverage}%`;
        //     tooltip = `Covered ${stat.coveredLines} of ${stat.totalLines} lines\n`;
        // }

        const displayCoverage = Flux.getState('displayCoverage') as boolean;
        this.statusBar.tooltip = `${tooltip}Click to toggle display coverage`;
        if (displayCoverage) {
            this.statusBar.text = `$(eye)${msg}`;
        } else {
            this.statusBar.text = `$(eye-closed)${msg}`;
        }
    }
}
